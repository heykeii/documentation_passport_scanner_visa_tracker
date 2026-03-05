import * as XLSX from 'xlsx';
import * as Passport from '../models/Passport.js'
import { incrementRecordCount } from '../services/sessionService.js';


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

// Convert Excel time fraction (0–1) or HH:MM strings to "HH:MM" (24-hr)
function normaliseTime(value) {
    if (!value) return '';
    const str = String(value).trim();
    if (!str) return '';

    // Excel time serial: a decimal fraction of a day (0.0 = 00:00, 0.5 = 12:00, etc.)
    // Also catches strings like "0.479166..." stored from a previous import
    const frac = parseFloat(str);
    if (!isNaN(frac) && frac >= 0 && frac < 1) {
        const totalMinutes = Math.round(frac * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
        const mm = String(totalMinutes % 60).padStart(2, '0');
        return `${hh}:${mm}`;
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
    // Strip special chars (handles things like "PORTAL *", "PPT#", etc.)
    const stripped = normalized.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    return HEADER_ALIASES[stripped] || null;
}



function normaliseDate(value) {
    if (!value) return '';
    const str = String(value).trim();
    if (!str) return '';

    // Pure integer string → likely an Excel serial date
    // Excel serials for dates 1941-2200 are roughly 15000-110000
    // Anything below 15000 is pre-1941 or could be a year like "1981" — skip conversion
    if (/^\d+$/.test(str)) {
        const serial = parseInt(str, 10);
        if (serial >= 15000 && serial <= 110000) {
            // Excel epoch: Dec 30, 1899 (accounts for the 1900 leap year bug)
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const date  = new Date(epoch.getTime() + serial * 864e5);
            const yyyy  = date.getUTCFullYear();
            if (yyyy >= 1900 && yyyy <= 2200) {
                const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(date.getUTCDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
    }

    // DD/MM/YYYY or D/M/YYYY → convert to ISO
    const dmyMatch = str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (dmyMatch) {
        const [, dd, mm, yyyy] = dmyMatch;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    // Already ISO or partial (no year) — store as-is
    return str;
}

export async function importExcel(req,res) {
    try {
        if (!req.file) {
            return res.status(400).json({success: false, error: "No file uploaded."});
        }
        const workbook = XLSX.read(req.file.buffer, {type:'buffer', cellDates: false});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, {defval: ''});

        if (rows.length === 0) {
            return res.status(400).json({success: false, error: 'The Excel file is empty'});
        }

        // Log actual headers for debugging
        const detectedHeaders = Object.keys(rows[0]);
        console.log('📋 Excel headers detected:', detectedHeaders);
        console.log('📋 Normalized headers:', detectedHeaders.map(h => `"${h}" → "${normalizeKey(h)}" → ${resolveField(h) || 'UNMATCHED'}`));

        const saved = [];
        const skipped = [];

        for (let i = 0; i<rows.length; i++) {
            const row = rows[i];
            const rowNum = i+2;

            // Map columns using robust case-insensitive alias lookup
            const data = {};
            for (const rawKey of Object.keys(row)) {
                const field = resolveField(rawKey);
                if (field && !data[field]) {
                    data[field] = String(row[rawKey]).trim();
                }
            }
            // Ensure all fields have at least an empty string
            const allFields = ['surname','firstName','middleName','portalRefNo','payment','agency',
                'dateOfBirth','passportNumber','dateOfIssue','dateOfExpiry',
                'appointmentDate','appointmentTime','embassy','departureDate','tourName'];
            for (const f of allFields) { if (!data[f]) data[f] = ''; }

            // Normalise date fields
            for (const f of DATE_FIELDS) {
                if (data[f]) data[f] = normaliseDate(data[f]);
            }
            // Normalise time field
            if (data.appointmentTime) data.appointmentTime = normaliseTime(data.appointmentTime);

            //Validate required fields
            const missing = REQUIRED_FIELDS.filter(f => !data[f]);
            if (missing.length) {
                skipped.push({row: rowNum, reason: `Missing required fields: ${missing.join(', ')}`});
                continue;
            }

            if(data.payment) data.payment = data.payment.toLowerCase();
            if (data.payment && !PAYMENT_VALUES.includes(data.payment)) {
                skipped.push({row: rowNum, reason: `Invalid payment value "${data.payment}". Must be unpaid, partial, or paid. `});
                continue;
            }

            if (data.dateOfBirth && data.dateOfIssue && new Date(data.dateOfBirth) >= new Date(data.dateOfIssue)) {
                skipped.push({ row: rowNum, reason: 'Date of Birth must be before Date of Issue.' });
                continue;
            }

            if (data.dateOfIssue && data.dateOfExpiry && new Date(data.dateOfIssue) >= new Date(data.dateOfExpiry)) {
                skipped.push({ row: rowNum, reason: 'Date of Issue must be before Date of Expiry.' });
                continue;
            }

            if (data.appointmentDate && data.departureDate && new Date(data.appointmentDate) >= new Date(data.departureDate)) {
                skipped.push({ row: rowNum, reason: 'Appointment Date must be before Departure Date.' });
                continue;
            }

            data.createdBy = req.user?.email || 'import';
            const record = await Passport.create(data);
            saved.push(record);

            if(req.user?.email) incrementRecordCount(req.user.email);

        }

        return res.status(200).json({
            success: true,
            message: `Import complete. ${saved.length} saved, ${skipped.length} skipped.`,
            saved: saved.length,
            skipped,
            debug: { detectedHeaders },
        });

    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}


export async function exportExcel (req,res){
    try {
        const records = await Passport.getAll();

        // Build rows with friendly column headers
        const rows = records.map(r => ({
            'Surname':          r.surname          || '',
            'First Name':       r.firstName        || '',
            'Middle Name':      r.middleName       || '',
            'Portal Ref No':    r.portalRefNo      || '',
            'Payment':          r.payment          || '',
            'Agency':           r.agency           || '',
            'Date of Birth':    r.dateOfBirth      || '',
            'Passport Number':  r.passportNumber   || '',
            'Date of Issue':    r.dateOfIssue      || '',
            'Date of Expiry':   r.dateOfExpiry     || '',
            'Appointment Date': r.appointmentDate  || '',
            'Appointment Time': r.appointmentTime  || '',
            'Embassy':          r.embassy          || '',
            'Departure Date':   r.departureDate    || '',
            'Tour Name':        r.tourName         || '',
            'Created By':       r.createdBy        || '',
            'Created At':       r.createdAt        || '',
        }));

        const worksheet  = XLSX.utils.json_to_sheet(rows);
        const workbook   = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Passenger Records');

        // Style column widths
        worksheet['!cols'] = [
            { wch: 18 }, // Surname
            { wch: 18 }, // First Name
            { wch: 18 }, // Middle Name
            { wch: 16 }, // Portal Ref No
            { wch: 10 }, // Payment
            { wch: 22 }, // Agency
            { wch: 14 }, // Date of Birth
            { wch: 20 }, // Passport Number
            { wch: 14 }, // Date of Issue
            { wch: 14 }, // Date of Expiry
            { wch: 18 }, // Appointment Date
            { wch: 14 }, // Appointment Time
            { wch: 20 }, // Embassy
            { wch: 16 }, // Departure Date
            { wch: 25 }, // Tour Name
            { wch: 25 }, // Created By
            { wch: 22 }, // Created At
        ];

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const filename = `passenger-records-${new Date().toISOString().slice(0, 10)}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

export async function downloadTemplate(req,res) {
    try {
        const templateRows = [{
            'Surname':          '',
            'First Name':       '',
            'Middle Name':      '',
            'Portal Ref No':    '',
            'Payment':          'unpaid/ partial/ paid',
            'Agency':           '',
            'Date of Birth':    '',
            'Passport Number':  '',
            'Date of Issue':    '',
            'Date of Expiry':   '',
            'Appointment Date': '',
            'Appointment Time': '',
            'Embassy':          '',
            'Departure Date':   '',
            'Tour Name':        '',
        }];

        const worksheet = XLSX.utils.json_to_sheet(templateRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        worksheet['!cols'] = [
            { wch: 18 }, // Surname
            { wch: 18 }, // First Name
            { wch: 18 }, // Middle Name
            { wch: 16 }, // Portal Ref No
            { wch: 24 }, // Payment
            { wch: 22 }, // Agency
            { wch: 14 }, // Date of Birth
            { wch: 20 }, // Passport Number
            { wch: 14 }, // Date of Issue
            { wch: 14 }, // Date of Expiry
            { wch: 18 }, // Appointment Date
            { wch: 14 }, // Appointment Time
            { wch: 20 }, // Embassy
            { wch: 16 }, // Departure Date
            { wch: 25 }, // Tour Name
        ];

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="passenger-records-template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}