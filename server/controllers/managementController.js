import XLSX from 'xlsx-js-style';
import * as Passport from '../models/Passport.js'
import { incrementRecordCount } from '../services/sessionService.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


// Maps every known header variant (lowercase) → internal field name.
// Supports both abbreviated headers (existing Excel) and full headers (template).
const HEADER_ALIASES = {
    // surname
    'surname':          'surname',
    // firstName
    'name':             'firstName',
    'first name':       'firstName',
    'firstname':        'firstName',
    // middleName
    'middle name':      'middleName',
    'middlename':       'middleName',
    // portalRefNo
    'portal':              'portalRefNo',
    'portal ref no':       'portalRefNo',
    'portal ref no.':      'portalRefNo',
    'portal ref. no':      'portalRefNo',
    'portal ref. no.':     'portalRefNo',
    'portal ref':          'portalRefNo',
    'portal #':            'portalRefNo',
    'portal no':           'portalRefNo',
    'portal no.':          'portalRefNo',
    'portalref':           'portalRefNo',
    'portalrefno':         'portalRefNo',
    'ref no':              'portalRefNo',
    'ref. no':             'portalRefNo',
    // payment
    'payment':          'payment',
    // agency
    'agency':           'agency',
    // dateOfBirth
    'dob':              'dateOfBirth',
    'date of birth':    'dateOfBirth',
    'dateofbirth':      'dateOfBirth',
    // passportNumber
    'ppt #':            'passportNumber',
    'ppt#':             'passportNumber',
    'passport number':  'passportNumber',
    'passport no':      'passportNumber',
    'passportnumber':   'passportNumber',
    // dateOfIssue
    'doi':              'dateOfIssue',
    'date of issue':    'dateOfIssue',
    'dateofissue':      'dateOfIssue',
    // dateOfExpiry
    'doe':              'dateOfExpiry',
    'date of expiry':   'dateOfExpiry',
    'dateofexpiry':     'dateOfExpiry',
    // appointmentDate
    'appt date':        'appointmentDate',
    'appointment date': 'appointmentDate',
    'apptdate':         'appointmentDate',
    // appointmentTime
    'time':             'appointmentTime',
    'appointment time': 'appointmentTime',
    'appt time':        'appointmentTime',
    // embassy
    'embassy':          'embassy',
    // departureDate
    'dep date':         'departureDate',
    'departure date':   'departureDate',
    'depdate':          'departureDate',
    // tourName
    'tour name':        'tourName',
    'tourname':         'tourName',
};

const REQUIRED_FIELDS = ['surname', 'firstName', 'passportNumber', 'portalRefNo'];
const PAYMENT_VALUES  = ['unpaid', 'partial', 'paid'];
const DATE_FIELDS     = ['dateOfBirth', 'dateOfIssue', 'dateOfExpiry', 'appointmentDate', 'departureDate'];
const isValidYear = (y) => Number.isInteger(y) && y >= 1900 && y <= 2200;
const isValidMonth = (m) => Number.isInteger(m) && m >= 0 && m <= 11;

function normalizePaymentValue(value) {
    if (value === undefined || value === null) return '';
    const normalized = String(value).trim().toLowerCase();
    if (!normalized || normalized === '0') return '';
    return normalized;
}

function parseMigrationMode(body = {}) {
    const mode = String(body.entryMode || 'normal').toLowerCase();
    const entryMode = mode === 'migration' ? 'migration' : 'normal';

    const month = body.migrationMonth === undefined || body.migrationMonth === null || body.migrationMonth === ''
        ? null
        : parseInt(body.migrationMonth, 10);
    const year = body.migrationYear === undefined || body.migrationYear === null || body.migrationYear === ''
        ? null
        : parseInt(body.migrationYear, 10);

    return {
        entryMode,
        migrationMonth: Number.isNaN(month) ? null : month,
        migrationYear: Number.isNaN(year) ? null : year,
    };
}

// Convert Excel time fraction (0–1) or HH:MM strings to "HH:MM" (24-hr)
function normaliseTime(value) {
    if (!value) return '';
    const str = String(value).trim();
    if (!str) return '';

    // Excel time serial: a decimal fraction of a day (0.0 = 00:00, 0.5 = 12:00, etc.)
    const frac = parseFloat(str);
    if (!isNaN(frac) && frac >= 0 && frac < 1) {
        const totalMinutes = Math.round(frac * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
        const mm = String(totalMinutes % 60).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    // 12-hr format like "8:30 AM" or "9:30 AM"
    const ampm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
        let hh = parseInt(ampm[1], 10);
        const mm = ampm[2];
        const period = ampm[3].toUpperCase();
        if (period === 'PM' && hh !== 12) hh += 12;
        if (period === 'AM' && hh === 12) hh = 0;
        return `${String(hh).padStart(2, '0')}:${mm}`;
    }

    // Already HH:MM or H:MM — pass through
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return str.slice(0, 5);

    return str;
}

// Strips invisible Unicode chars, collapses whitespace, lowercases
function normalizeKey(str) {
    return String(str)
        .replace(/[\u00A0\u200B\u200C\u200D\uFEFF\t\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

// Lookup with fallback: try exact normalized key, then strip all non-alphanumeric
function resolveField(rawKey) {
    const normalized = normalizeKey(rawKey);
    if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
    const stripped = normalized.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    return HEADER_ALIASES[stripped] || null;
}

// ── FIX: Always use the raw numeric serial for date columns. ─────────────────
// For date columns cell.w holds the display string (e.g. "2/8/2004").
// normaliseDate always treats the first component as day (DD/MM/YYYY),
// so "2/8/2004" → August 2, not February 8.
// The raw serial represents the Excel-locale interpretation (often MM/DD)
// and is only used as a fallback when there is no display text.
function normaliseDate(value) {
    if (!value) return '';
    const str = String(value).trim();
    if (!str) return '';

    // ── Excel serial number ──────────────────────────────────────────────────
    // Serials for 1941–2200 fall in ~15 000 – 110 000.
    // Plain 4-digit years ("1981") are excluded by the lower bound.
    if (/^\d+$/.test(str)) {
        const serial = parseInt(str, 10);
        if (serial >= 15000 && serial <= 110000) {
            // Excel epoch: 30 Dec 1899 (accounts for the 1900 leap-year bug)
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const date  = new Date(epoch.getTime() + serial * 864e5);
            const yyyy  = date.getUTCFullYear();
            if (yyyy >= 1900 && yyyy <= 2200) {
                const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(date.getUTCDate()).padStart(2, '0');
                return `${dd}/${mm}/${yyyy}`;
            }
        }
        // Not an Excel serial (e.g. a bare year) — return as-is
        return str;
    }

    // ── Slash-delimited — ALWAYS treat as DD/MM, handles 2-digit or 4-digit year ─
    // Excel often formats dates as M/D/YY (e.g. "6/9/13" for Sep 6, 2013).
    const slashMatch = str.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
    if (slashMatch) {
        const d = parseInt(slashMatch[1], 10);
        const m = parseInt(slashMatch[2], 10);
        let y = parseInt(slashMatch[3], 10);
        // Expand 2-digit year: 00–49 → 2000–2049, 50–99 → 1950–1999
        if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;

        // Validate calendar correctness under DD/MM/YYYY interpretation
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2200) {
            const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const parsed = dayjs(iso, 'YYYY-MM-DD', true);
            if (parsed.isValid()) {
                return parsed.format('DD/MM/YYYY');
            }
        }
        return str;
    }

    // ── Dash / dot / ISO / named-month formats ───────────────────────────────
    // NOTE: MM-DD-YYYY and M-D-YYYY intentionally removed — data is never US-formatted.
    const formats = [
        'DD-MM-YYYY',
        'D-M-YYYY',
        'DD.MM.YYYY',
        'D.M.YYYY',
        'YYYY-MM-DD',  // ISO — unambiguous
        'DDMMMYYYY',   // 11Oct1991
        'D MMM YYYY',  // 1 May 2026
        'D-MMM-YYYY',  // 1-May-2026
        'D-MMM-YY',    // 1-May-26
    ];

    for (const format of formats) {
        const parsed = dayjs(str, format, true);
        if (parsed.isValid() && parsed.year() >= 1900 && parsed.year() <= 2200) {
            return parsed.format('DD/MM/YYYY');
        }
    }

    // Last resort — flexible parse (not strict)
    const flexParsed = dayjs(str);
    if (flexParsed.isValid() && flexParsed.year() >= 1900 && flexParsed.year() <= 2200) {
        return flexParsed.format('DD/MM/YYYY');
    }

    // Unable to parse — store as-is so the UI can flag it
    return str;
}

function normaliseAppointmentDate(value, fallbackYear) {
    const str = String(value || '').trim();
    if (!str) return '';

    const hasExplicitYear =
        /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(str) ||
        /^\d{4}-\d{2}-\d{2}$/.test(str) ||
        /\b\d{4}\b/.test(str);

    if (hasExplicitYear) return normaliseDate(str);

    const noYearFormats = [
        'D/M', 'DD/MM',
        'D-M', 'DD-MM',
        'D.M', 'DD.MM',
        'D MMM', 'DD MMM',
        'MMM D', 'MMM DD',
        'D-MMM', 'DD-MMM',
        'MMM-D', 'MMM-DD',
    ];

    for (const format of noYearFormats) {
        const parsed = dayjs(str, format, true);
        if (parsed.isValid()) {
            const d = parsed.date();
            const m = parsed.month() + 1;
            return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
        }
    }

    const flexParsed = dayjs(str);
    if (flexParsed.isValid() && !hasExplicitYear) {
        const d = flexParsed.date();
        const m = flexParsed.month() + 1;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    }

    return normaliseDate(str);
}

function resolveExportDate(rec) {
    const MONTH_NAMES_EXP = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const created = rec.createdAt ? new Date(rec.createdAt) : null;
    const createdValid = created && !isNaN(created) ? created : null;
    const isMigrationEntry = String(rec.entryMode || '').toLowerCase() === 'migration';
    const currentYear = new Date().getFullYear();

    const migrationMonth = Number.isInteger(rec.migrationMonth)
        ? rec.migrationMonth
        : parseInt(rec.migrationMonth, 10);
    const migrationYear = Number.isInteger(rec.migrationYear)
        ? rec.migrationYear
        : parseInt(rec.migrationYear, 10);
    const hasMigrationDate = 
        !isNaN(migrationMonth) && migrationMonth >= 0 && migrationMonth <= 11 &&
        !isNaN(migrationYear) && migrationYear >= 1900 && migrationYear <= 2200;

    const appt = rec.appointmentDate ? String(rec.appointmentDate).trim() : '';

    if (!appt) {
        if (hasMigrationDate) return new Date(migrationYear, migrationMonth, 1);
        if (rec.entryMode === 'migration') return null;
        return createdValid;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(appt)) {
        const [dd, mm, yyyy] = appt.split('/');
        if (isMigrationEntry && hasMigrationDate) 
            return new Date(migrationYear, migrationMonth, parseInt(dd, 10));
        return new Date(parseInt(yyyy,10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(appt)) {
        if (isMigrationEntry && hasMigrationDate)
            return new Date(migrationYear, migrationMonth, parseInt(appt.split('-'[2], 10)))
        return new Date(appt);
    }

    if (/^\d{1,2}\/\d{1,2}$/.test(appt)) {
        const [dd, mm] = appt.split('/');
        const yearForFilter = isMigrationEntry && hasMigrationDate ? migrationYear : currentYear;
        return new Date(yearForFilter, parseInt(mm, 10) - 1, parseInt(dd,10));
    }

    const partial = appt.match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
    if (partial) {
        const m = MONTH_NAMES_EXP.indexOf(partial[2].toLowerCase());
        if (m >= 0) {
            const yearForFilter = isMigrationEntry && hasMigrationDate ? migrationYear : currentYear;
            return new Date(yearForFilter, m, parseInt(partial[1], 10));
        }
    }
    if (hasMigrationDate) return new Date(migrationYear, migrationMonth, 1);
    if (rec.entryMode === 'migration') return null;
    return createdValid;

}

export async function importExcel(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
        const migrationMeta = parseMigrationMode(req.body || {});

        if (migrationMeta.entryMode === 'migration') {
            if (!isValidMonth(migrationMeta.migrationMonth) || !isValidYear(migrationMeta.migrationYear)) {
                return res.status(400).json({ success: false, error: 'Migration mode requires valid month and year.' });
            }
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // For date columns we resolve the ambiguity between DD/MM and MM/DD:
        //
        //  • "2/26/2026" — second component 26 > 12, so it CANNOT be a month.
        //    This is unambiguously MM/DD. Use the raw serial so normaliseDate
        //    converts it via the epoch calculation, giving the exact date.
        //
        //  • "2/8/2004" — both components ≤ 12, ambiguous. The user enters dates
        //    in DD/MM/YYYY format, so "2/8" means 2nd August, not 8th February.
        //    Return cell.w as-is; normaliseDate will parse the first component
        //    as day and the second as month → August 2, 2004.
        //
        //  • If there is no display text at all, fall back to the raw serial.
        const getCellText = (cell, isDateCol = false) => {
            if (!cell) return '';

            if (isDateCol) {
                const wStr = typeof cell.w === 'string' ? cell.w.trim() : '';

                if (wStr) {
                    // Match both 4-digit and 2-digit year slash dates (e.g. "6/9/13" or "6/9/2013")
                    const slashParts = wStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
                    if (slashParts) {
                        const second = parseInt(slashParts[2], 10);
                        if (second > 12) {
                            // Unambiguous MM/DD (e.g. "2/26/2026") — use serial for accuracy
                            if (cell.t === 'n' && cell.v != null) return String(Math.round(cell.v));
                        }
                        // Ambiguous (both ≤ 12) or first > 12 — return display text;
                        // normaliseDate will treat first component as day (DD/MM)
                        return wStr;
                    }
                    // Non-slash display text ("1-May-2026", etc.) — pass through
                    return wStr;
                }

                // No display text: use raw serial
                if (cell.t === 'n' && cell.v != null) return String(Math.round(cell.v));
                if (cell.v != null) return String(cell.v).trim();
                return '';
            }

            // Non-date: prefer display text, fall back to raw value
            if (typeof cell.w === 'string' && cell.w.trim()) return cell.w.trim();
            if (cell.v === undefined || cell.v === null) return '';
            return String(cell.v).trim();
        };

        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const headerRow = range.s.r;

        const colFieldMap = new Map();
        const detectedHeaders = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
            const headerRef = XLSX.utils.encode_cell({ r: headerRow, c });
            const headerText = getCellText(sheet[headerRef]);
            detectedHeaders.push(headerText);
            const field = resolveField(headerText);
            if (field) colFieldMap.set(c, field);
        }

        const dateFieldSet = new Set(DATE_FIELDS);
        const rows = [];
        for (let r = headerRow + 1; r <= range.e.r; r++) {
            const rowObj = {};
            for (const [c, field] of colFieldMap.entries()) {
                const ref = XLSX.utils.encode_cell({ r, c });
                const cell = sheet[ref];
                const value = getCellText(cell, dateFieldSet.has(field));
                if (value) rowObj[field] = value;
            }
            rows.push(rowObj);
        }

        if (rows.length === 0) {
            return res.status(400).json({ success: false, error: 'The Excel file is empty' });
        }

        const saved   = [];
        const skipped = [];

        for (let i = 0; i < rows.length; i++) {
            const row    = rows[i];
            const rowNum = i + 2;

            const data = {};
            for (const [field, val] of Object.entries(row)) {
                if (!data[field]) data[field] = String(val).trim();
            }

            const allFields = [
                'surname', 'firstName', 'middleName', 'portalRefNo', 'payment', 'agency',
                'dateOfBirth', 'passportNumber', 'dateOfIssue', 'dateOfExpiry',
                'appointmentDate', 'appointmentTime', 'embassy', 'departureDate', 'tourName',
            ];
            for (const f of allFields) { if (!data[f]) data[f] = ''; }

            data.entryMode      = migrationMeta.entryMode;
            data.migrationMonth = migrationMeta.entryMode === 'migration' ? migrationMeta.migrationMonth : null;
            data.migrationYear  = migrationMeta.entryMode === 'migration' ? migrationMeta.migrationYear  : null;

            const appointmentFallbackYear = migrationMeta.entryMode === 'migration'
                ? migrationMeta.migrationYear
                : new Date().getFullYear();

            // Normalise date fields
            for (const f of DATE_FIELDS) {
                if (!data[f]) continue;
                if (f === 'appointmentDate') {
                    data[f] = normaliseAppointmentDate(data[f], appointmentFallbackYear);
                    continue;
                }
                data[f] = normaliseDate(data[f]);
            }
            // Normalise time field
            if (data.appointmentTime) data.appointmentTime = normaliseTime(data.appointmentTime);

            // Validate required fields
            const missing = REQUIRED_FIELDS.filter(f => !data[f]);
            if (missing.length) {
                skipped.push({ row: rowNum, reason: `Missing required fields: ${missing.join(', ')}` });
                continue;
            }

            data.payment = normalizePaymentValue(data.payment);
            if (data.payment && !PAYMENT_VALUES.includes(data.payment)) {
                skipped.push({ row: rowNum, reason: `Invalid payment value "${data.payment}". Must be unpaid, partial, or paid.` });
                continue;
            }

            if (data.dateOfBirth && data.dateOfIssue) {
                const dob = dayjs(data.dateOfBirth, 'DD/MM/YYYY', true);
                const doi = dayjs(data.dateOfIssue, 'DD/MM/YYYY', true);
                if (dob.isValid() && doi.isValid() && dob.isSameOrAfter(doi)) {
                    skipped.push({ row: rowNum, reason: 'Date of Birth must be before Date of Issue.' });
                    continue;
                }
            }

            if (data.dateOfIssue && data.dateOfExpiry) {
                const doi = dayjs(data.dateOfIssue, 'DD/MM/YYYY', true);
                const doe = dayjs(data.dateOfExpiry, 'DD/MM/YYYY', true);
                if (doi.isValid() && doe.isValid() && doi.isSameOrAfter(doe)) {
                    skipped.push({ row: rowNum, reason: 'Date of Issue must be before Date of Expiry.' });
                    continue;
                }
            }

            if (data.appointmentDate && data.departureDate) {
                const appt = dayjs(data.appointmentDate, 'DD/MM/YYYY', true);
                const dep  = dayjs(data.departureDate,   'DD/MM/YYYY', true);
                if (appt.isValid() && dep.isValid() && appt.isSameOrAfter(dep)) {
                    skipped.push({ row: rowNum, reason: 'Appointment Date must be before Departure Date.' });
                    continue;
                }
            }

            data.createdBy = req.user?.email || 'import';
            const record = await Passport.create(data);
            saved.push(record);

            if (req.user?.email) incrementRecordCount(req.user.email);
        }

        return res.status(200).json({
            success: true,
            message: `Import complete. ${saved.length} saved, ${skipped.length} skipped.`,
            saved: saved.length,
            skipped,
            debug: { detectedHeaders },
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}


export async function exportExcel(req, res) {
   try {
    let records = await Passport.getAll();

    const rawMonth = req.query.month;
    const rawYear = req.query.year;
    const filterMonth = (rawMonth !== undefined && rawMonth !== '') ? parseInt(rawMonth, 10) : null;
    const filterYear  = (rawYear  !== undefined && rawYear  !== '') ? parseInt(rawYear,  10) : null;

    const hasMonthFilter = filterMonth !== null && !isNaN(filterMonth) && filterMonth >= 0 && filterMonth <= 11;
    const hasYearFilter = filterYear !== null && !isNaN(filterYear) && filterYear >= 1900 && filterYear <= 2200;

    if (hasMonthFilter || hasYearFilter) {
        records = records.filter(rec => {
            const d = resolveExportDate(rec);
            if (!d || isNaN(d)) return false;
            const monthOk =!hasMonthFilter || d.getMonth() === filterMonth;
            const yearOk = !hasYearFilter || d.getFullYear() === filterYear;
            return monthOk && yearOk;
        });
    }

    const fmtDate = (d) => (!d ? '' : String(d));

    const fmtTime = (t) => {
        if(!t) return '';
        const m = String(t).match(/^(\d{1,2}):(\d{2})/);
        if (!m) return String(t);
        const hh = parseInt(m[1], 10), mm = m[2];
        const period = hh < 12 ? 'AM' : 'PM';
        return `${hh % 12 || 12}:${mm} ${period}`;
    };

    const headers = [
        '#', 'SURNAME', 'NAME', 'MIDDLE NAME', 'PORTAL', 'PAYMENT', 'AGENCY',
        'DOB', 'PPT #', 'DOI', 'DOE', 'APPT DATE', 'TIME', 'EMBASSY', 'DEP DATE', 'TOUR NAME',
    ];

    const rows = records.map((r, i) => ([
        i + 1,
        r.surname || '',
        r.firstName || '',
        r.middleName || '',
        r.portalRefNo || '',
        r.payment || '',
        r.agency || '',
        fmtDate(r.dateOfBirth),
        r.passportNumber || '',
        fmtDate(r.dateOfIssue),
        fmtDate(r.dateOfExpiry),
        fmtDate(r.appointmentDate),
        fmtTime(r.appointmentTime),
        r.embassy || '',
        fmtDate(r.departureDate),
        r.tourName || '',
    ]));

    const MONTH_LABELS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    let filenameSlug = new Date().toISOString().slice(0, 10);
    let monthBandLabel = 'ALL RECORDS';

    if (hasMonthFilter && hasYearFilter) {
        filenameSlug = `${MONTH_LABELS[filterMonth].slice(0, 3).toLowerCase()}-${filterYear}`;
        monthBandLabel = `${MONTH_LABELS[filterMonth].toUpperCase()} ${filterYear}`;
    } else if (hasMonthFilter) {
        filenameSlug = MONTH_LABELS[filterMonth].slice(0, 3).toLowerCase();
        monthBandLabel = MONTH_LABELS[filterMonth].toUpperCase();
    } else if (hasYearFilter) {
        filenameSlug = String(filterYear);
        monthBandLabel = String(filterYear);
    }

    const monthBand = new Array(headers.length).fill('');
    monthBand[1] = monthBandLabel;
    const aoa = [headers, monthBand, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(aoa, {sheetStubs: true});
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Passenger Records');

    worksheet['!cols'] = [
        {wch:4}, {wch:16}, {wch:18}, {wch:16},{ wch: 12 },
            { wch: 10 }, { wch: 42 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
            { wch: 13 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 28 },
    ];

    worksheet['!freeze'] = {xSplit: 0, ySplit: 2, topLeftCell: 'A3', activePane: 'bottomLeft'};
    worksheet['!merges'] = [{s: {r: 1, c: 1}, e: {r:1, c:15}}];
    worksheet['!autofilter'] = { ref: 'A1:P1'};

    const HEADER_COLORS = [
        '1F6B75', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', 'E26B0A',
        '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', 'C00000',
    ];

    const headerStyle = (bgHex) => ({
        font: {bold: true, color: { rgb: 'FFFFFF'}, sz: 11, name: 'Calibri'},
        fill: {fgColor: {rgb: bgHex}, patternType: 'solid'},
        alignment: {horizontal: 'center', vertical: 'center', wrapText: false},
        border: {bottom: {style: 'thin', color: {rgb: 'FFFFFF'}}},
    });

    const gridBorder = {
        top: {style: 'thin', color: {rgb: '1F1F1F'}},
        bottom: {style: 'thin', color: {rgb: '1F1F1F'}},
        left: {style: 'thin', color: {rgb: '1F1F1F'}},
        right: {style: 'thin', color: {rgb: '1F1F1F'}},
    }

    const bodyStyle = (bgHex = null) => ({
        font: {sz: 10, color: {rgb: '000000'}, name: 'Calibri'},
        fill: bgHex ? {fgColor : {rgb: bgHex}, patternType: 'solid'} : undefined,
        alignment: {horizontal: 'left', vertical: 'center', wrapText: false},
        border: gridBorder,
    });

    const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
        colLetters.forEach((col, i) => {
            const ref = `${col}1`;
            if (worksheet[ref]) worksheet[ref].s = headerStyle(HEADER_COLORS[i]);
        });

        worksheet['A2'].s = {
            fill:   { fgColor: { rgb: '0B2447' }, patternType: 'solid' },
            border: gridBorder,
        };
        worksheet['B2'].s = {
            font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 16, name: 'Calibri' },
            fill:      { fgColor: { rgb: '0B2447' }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    gridBorder,
        };

        const bodyFillByCol = {
            B: 'F2F2F2', C: 'F2F2F2', D: 'F2F2F2',
            E: '5BC0DE',
            F: 'C6E0B4', G: 'C6E0B4',
            N: 'B4C6E7', O: 'B4C6E7',
        };

        const lastRow = rows.length + 2;
        for (let r = 3; r <= lastRow; r++) {
            for (const col of colLetters) {
                const ref = `${col}${r}`;
                if (!worksheet[ref]) worksheet[ref] = { t: 's', v: '' };
                worksheet[ref].s = bodyStyle(bodyFillByCol[col] || null);
            }
            const payRef = `F${r}`;
            worksheet[payRef].s = {
                ...worksheet[payRef].s,
                font: { ...worksheet[payRef].s.font, bold: true },
            };
        }

        worksheet['!rows'] = [{ hpt: 20 }, { hpt: 22 }];

        const buffer   = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const filename = `passenger-records-${filenameSlug}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);


   } catch (error) {
        return res.status(500).json({success: false, error: error.message});
   }
}


export async function downloadTemplate(req, res) {
    try {
        const headers = [
            '#', 'SURNAME', 'NAME', 'MIDDLE NAME', 'PORTAL', 'PAYMENT', 'AGENCY',
            'DOB', 'PPT #', 'DOI', 'DOE', 'APPT DATE', 'TIME', 'EMBASSY', 'DEP DATE', 'TOUR NAME',
        ];

        const monthBand = new Array(headers.length).fill('');
        monthBand[1] = 'JANUARY';

        // Create 10 empty rows for users to fill in
        const emptyRows = Array.from({ length: 10 }, () => new Array(headers.length).fill(''));

        const worksheet = XLSX.utils.aoa_to_sheet([headers, monthBand, ...emptyRows], { sheetStubs: true });
        const workbook  = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        worksheet['!cols'] = [
            { wch:  4 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 },
            { wch: 10 }, { wch: 42 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
            { wch: 13 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 28 },
        ];

        worksheet['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', activePane: 'bottomLeft' };
        worksheet['!merges'] = [{ s: { r: 1, c: 1 }, e: { r: 1, c: 15 } }];
        worksheet['!autofilter'] = { ref: 'A1:P1' };

        const HEADER_COLORS = [
            '1F6B75', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', 'E26B0A',
            '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', '0B2447', 'C00000',
        ];

        const gridBorder = {
            top:    { style: 'thin', color: { rgb: '1F1F1F' } },
            bottom: { style: 'thin', color: { rgb: '1F1F1F' } },
            left:   { style: 'thin', color: { rgb: '1F1F1F' } },
            right:  { style: 'thin', color: { rgb: '1F1F1F' } },
        };

        const headerStyle = (bgHex) => ({
            font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
            fill:      { fgColor: { rgb: bgHex }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
            border:    gridBorder,
        });

        const bodyStyle = (bgHex = null) => ({
            font:      { sz: 10, color: { rgb: '000000' }, name: 'Calibri' },
            fill:      bgHex ? { fgColor: { rgb: bgHex }, patternType: 'solid' } : undefined,
            alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
            border:    gridBorder,
        });

        const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
        colLetters.forEach((col, i) => {
            const ref = `${col}1`;
            if (worksheet[ref]) worksheet[ref].s = headerStyle(HEADER_COLORS[i]);
        });

        worksheet['A2'].s = {
            fill:   { fgColor: { rgb: '0B2447' }, patternType: 'solid' },
            border: gridBorder,
        };
        worksheet['B2'].s = {
            font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 16, name: 'Calibri' },
            fill:      { fgColor: { rgb: '0B2447' }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center' },
            border:    gridBorder,
        };

        const bodyFillByCol = {
            B: 'F2F2F2', C: 'F2F2F2', D: 'F2F2F2',
            E: '5BC0DE',
            F: 'C6E0B4', G: 'C6E0B4',
            N: 'B4C6E7', O: 'B4C6E7',
        };

        const lastEmptyRow = emptyRows.length + 2;
        for (let r = 3; r <= lastEmptyRow; r++) {
            for (const col of colLetters) {
                const ref = `${col}${r}`;
                if (!worksheet[ref]) worksheet[ref] = { t: 's', v: '' };
                worksheet[ref].s = bodyStyle(bodyFillByCol[col] || null);
            }

            const payRef = `F${r}`;
            worksheet[payRef].s = {
                ...worksheet[payRef].s,
                font: { ...worksheet[payRef].s.font, bold: true },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
            };

            for (const c of ['L', 'M']) {
                const ref = `${c}${r}`;
                worksheet[ref].s = {
                    ...worksheet[ref].s,
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
                };
            }

            const tourRef = `P${r}`;
            worksheet[tourRef].s = {
                ...worksheet[tourRef].s,
                font: { ...worksheet[tourRef].s.font, bold: true, color: { rgb: 'E60000' } },
            };
        }

        worksheet['!rows'] = [{ hpt: 20 }, { hpt: 22 }];

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="passenger-records-template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}