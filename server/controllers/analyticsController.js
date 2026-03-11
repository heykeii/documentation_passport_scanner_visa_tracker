import XLSX from 'xlsx-js-style';
import * as VisaTransaction from '../models/VisaTransaction.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

// ─── Header normalization ────────────────────────────────────────────────────
const HEADER_ALIASES = {
    'ref no':          'refNo',
    'ref no.':         'refNo',
    'ref. no':         'refNo',
    'ref. no.':        'refNo',
    'ref':             'refNo',
    'transaction':     'transactionType',
    'transact':        'transactionType',
    'agents':          'agentName',
    'agent':           'agentName',
    'status':          'status',
    'no. of pa':       'numberOfPax',
    'no. of pas':      'numberOfPax',
    'no. of pax':      'numberOfPax',
    'no of pax':       'numberOfPax',
    'no of pa':        'numberOfPax',
    'pax':             'numberOfPax',
    'total soa':       'totalSOA',
    'totalsoa':        'totalSOA',
    'total po':        'totalPO',
    'total p.o.':      'totalPO',
    'totalpo':         'totalPO',
    'net profit':      'netProfit',
    'netprofit':       'netProfit',
    'soa no.':         'soaNumber',
    'soa no':          'soaNumber',
    'soa number':      'soaNumber',
    'soano':           'soaNumber',
    'departure':       'departureDate',
    'departure date':  'departureDate',
    'dep date':        'departureDate',
    'dep. date':       'departureDate',
    'area':            'area',
};

const CURRENCY_FIELDS = new Set(['totalSOA', 'totalPO', 'netProfit']);
const INTEGER_FIELDS  = new Set(['numberOfPax']);

function normalizeKey(str) {
    return String(str)
        .replace(/[\u00A0\u200B\u200C\u200D\uFEFF\t\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function resolveField(rawKey) {
    const normalized = normalizeKey(rawKey);
    if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
    const stripped = normalized.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    return HEADER_ALIASES[stripped] || null;
}

// ─── Cell value extraction ───────────────────────────────────────────────────
function getCellValue(cell, fieldType) {
    if (!cell) return fieldType === 'currency' ? 0 : fieldType === 'integer' ? 0 : '';

    if (fieldType === 'currency') {
        // Prefer raw numeric value from Excel
        if (cell.t === 'n' && cell.v !== undefined && cell.v !== null) return cell.v;
        const str = String(cell.w || cell.v || '').trim();
        if (!str || str === '₱-' || str === '-') return 0;
        const cleaned = str.replace(/[₱,\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    if (fieldType === 'integer') {
        if (cell.t === 'n' && cell.v !== undefined && cell.v !== null) return Math.round(cell.v);
        const str = String(cell.w || cell.v || '').trim().replace(/,/g, '');
        const num = parseInt(str, 10);
        return isNaN(num) ? 0 : num;
    }

    // Text: prefer display string, fallback to raw
    if (typeof cell.w === 'string' && cell.w.trim()) return cell.w.trim();
    if (cell.v === undefined || cell.v === null) return '';
    return String(cell.v).trim();
}

// ─── Region mapping ──────────────────────────────────────────────────────────
const REGION_RULES = [
    { pattern: /manila|quezon city|makati|pasig|taguig|mandaluyong|marikina|caloocan|las pi[ñn]as|para[ñn]aque|muntinlupa|pasay|malabon|navotas|valenzuela/i, region: 'NCR' },
    { pattern: /pampanga|bulacan|tarlac|nueva ecija|zambales|bataan|aurora|angeles/i,                                                                          region: 'Region III' },
    { pattern: /cavite|laguna|batangas|rizal/i,                                                                                                                region: 'Region IV-A' },
    { pattern: /camarines|albay|sorsogon|masbate|catanduanes|bicol/i,                                                                                          region: 'Region V' },
    { pattern: /iloilo|capiz|aklan|antique|guimaras|negros occidental/i,                                                                                       region: 'Region VI' },
    { pattern: /cebu|bohol|negros oriental|siquijor/i,                                                                                                         region: 'Region VII' },
    { pattern: /davao/i,                                                                                                                                       region: 'Region XI' },
    { pattern: /general santos|south cotabato|sarangani|sultan kudarat|cotabato/i,                                                                             region: 'Region XII' },
    { pattern: /^direct$/i,                                                                                                                                    region: 'Direct' },
];

function mapToRegion(area) {
    if (!area) return 'Other';
    const s = String(area).trim();
    for (const { pattern, region } of REGION_RULES) {
        if (pattern.test(s)) return region;
    }
    return 'Other';
}

function parseDepartureMonthYear(dateStr) {
    const parsed = dayjs(String(dateStr || ''), 'DD/MM/YYYY', true);
    if (parsed.isValid()) return { month: parsed.month() + 1, year: parsed.year() };
    return { month: null, year: null };
}

// ─── IMPORT ──────────────────────────────────────────────────────────────────
export async function importAnalyticsExcel(req, res) {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

        const importMonth = req.body.month ? parseInt(req.body.month, 10) : null;
        const importYear  = req.body.year  ? parseInt(req.body.year,  10) : null;
        const shouldReplace = req.body.replace === 'true' || req.body.replace === true;

        // Clear existing data for this month/year if replace=true
        if (shouldReplace && importMonth && importYear) {
            await VisaTransaction.deleteByMonthYear(importMonth, importYear);
        }

        const workbook  = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const sheet     = workbook.Sheets[sheetName];
        const range     = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const headerRow = range.s.r;

        // Build column → field map from header row
        const colFieldMap = new Map();
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c })];
            if (!cell) continue;
            const field = resolveField(getCellValue(cell, 'text'));
            if (field) colFieldMap.set(c, field);
        }

        const saved   = [];
        const skipped = [];

        for (let r = headerRow + 1; r <= range.e.r; r++) {
            const raw = {};
            for (const [c, field] of colFieldMap.entries()) {
                const cell      = sheet[XLSX.utils.encode_cell({ r, c })];
                const fieldType = CURRENCY_FIELDS.has(field) ? 'currency' : INTEGER_FIELDS.has(field) ? 'integer' : 'text';
                raw[field]      = getCellValue(cell, fieldType);
            }

            // Skip totals rows or blank rows (no Ref No)
            const refNo = String(raw.refNo || '').trim();
            if (!refNo) {
                skipped.push({ row: r + 1, reason: 'Empty Ref No (totals or blank row)' });
                continue;
            }

            // Derive month/year from departure date, fall back to import params
            const { month: dMonth, year: dYear } = parseDepartureMonthYear(raw.departureDate);
            const rowMonth = dMonth || importMonth;
            const rowYear  = dYear  || importYear;

            const totalSOA  = typeof raw.totalSOA  === 'number' ? raw.totalSOA  : 0;
            const totalPO   = typeof raw.totalPO   === 'number' ? raw.totalPO   : 0;
            // Use imported netProfit when available; recalculate if missing
            const netProfit = typeof raw.netProfit === 'number' ? raw.netProfit : (totalSOA - totalPO);

            const record = await VisaTransaction.create({
                refNo,
                transactionType: String(raw.transactionType || 'Visa').trim(),
                agentName:       String(raw.agentName       || '').trim(),
                status:          String(raw.status          || '').trim(),
                numberOfPax:     typeof raw.numberOfPax === 'number' ? raw.numberOfPax : 0,
                totalSOA,
                totalPO,
                netProfit,
                soaNumber:       String(raw.soaNumber     || '').trim(),
                departureDate:   String(raw.departureDate || '').trim(),
                area:            String(raw.area          || '').trim(),
                region:          mapToRegion(raw.area),
                month:           rowMonth,
                year:            rowYear,
            });
            saved.push(record);
        }

        return res.status(200).json({
            success: true,
            message: `Import complete. ${saved.length} saved, ${skipped.length} skipped.`,
            saved:   saved.length,
            skipped,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ─── GET ANALYTICS ───────────────────────────────────────────────────────────
export async function getAnalytics(req, res) {
    try {
        const filterMonth = req.query.month ? parseInt(req.query.month, 10) : null;
        const filterYear  = req.query.year  ? parseInt(req.query.year,  10) : null;

        const transactions = (filterMonth && filterYear)
            ? await VisaTransaction.getByMonthYear(filterMonth, filterYear)
            : await VisaTransaction.getAll();

        // KPI totals
        const kpi = transactions.reduce(
            (acc, t) => {
                acc.totalSOA  += t.totalSOA   || 0;
                acc.totalPO   += t.totalPO    || 0;
                acc.netProfit += t.netProfit  || 0;
                acc.totalPax  += t.numberOfPax || 0;
                return acc;
            },
            { totalSOA: 0, totalPO: 0, netProfit: 0, totalPax: 0 }
        );

        // By agent
        const agentMap = {};
        for (const t of transactions) {
            const k = t.agentName || 'Unknown';
            if (!agentMap[k]) agentMap[k] = { agentName: k, totalSOA: 0, totalPO: 0, netProfit: 0, pax: 0 };
            agentMap[k].totalSOA  += t.totalSOA   || 0;
            agentMap[k].totalPO   += t.totalPO    || 0;
            agentMap[k].netProfit += t.netProfit  || 0;
            agentMap[k].pax       += t.numberOfPax || 0;
        }
        const byAgent = Object.values(agentMap).sort((a, b) => b.netProfit - a.netProfit);

        // By status
        const statusMap = {};
        for (const t of transactions) {
            const k = t.status || 'Unknown';
            if (!statusMap[k]) statusMap[k] = { status: k, count: 0, pax: 0 };
            statusMap[k].count++;
            statusMap[k].pax += t.numberOfPax || 0;
        }
        const byStatus = Object.values(statusMap);

        // By region
        const regionMap = {};
        for (const t of transactions) {
            const k = t.region || 'Other';
            if (!regionMap[k]) regionMap[k] = { region: k, totalSOA: 0, totalPO: 0, netProfit: 0, pax: 0 };
            regionMap[k].totalSOA  += t.totalSOA   || 0;
            regionMap[k].totalPO   += t.totalPO    || 0;
            regionMap[k].netProfit += t.netProfit  || 0;
            regionMap[k].pax       += t.numberOfPax || 0;
        }
        const byRegion = Object.values(regionMap).sort((a, b) => b.netProfit - a.netProfit);

        // Monthly trend
        const MLABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendMap = {};
        for (const t of transactions) {
            if (!t.month || !t.year) continue;
            const k = `${t.year}-${String(t.month).padStart(2, '0')}`;
            if (!trendMap[k]) trendMap[k] = {
                key: k, month: t.month, year: t.year,
                label: `${MLABELS[t.month]} ${t.year}`,
                totalSOA: 0, totalPO: 0, netProfit: 0, pax: 0,
            };
            trendMap[k].totalSOA  += t.totalSOA   || 0;
            trendMap[k].totalPO   += t.totalPO    || 0;
            trendMap[k].netProfit += t.netProfit  || 0;
            trendMap[k].pax       += t.numberOfPax || 0;
        }
        const monthlyTrend = Object.values(trendMap).sort((a, b) => a.key.localeCompare(b.key));

        // Profit margin per agent (only agents with revenue)
        const byAgentMargin = byAgent
            .filter(a => a.totalSOA > 0)
            .map(a => ({
                agentName: a.agentName,
                pax:       a.pax,
                totalSOA:  a.totalSOA,
                netProfit: a.netProfit,
                margin:    parseFloat(((a.netProfit / a.totalSOA) * 100).toFixed(2)),
            }))
            .sort((a, b) => b.margin - a.margin);

        return res.status(200).json({
            success: true,
            data: { transactions, kpi, byAgent, byStatus, byRegion, monthlyTrend, byAgentMargin },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ─── CLEAR MONTH DATA (re-import support) ────────────────────────────────────
export async function clearMonthData(req, res) {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ success: false, error: 'month and year are required.' });
        const deleted = await VisaTransaction.deleteByMonthYear(parseInt(month, 10), parseInt(year, 10));
        return res.status(200).json({ success: true, deleted });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ─── EXPORT EXCEL ────────────────────────────────────────────────────────────
export async function exportAnalyticsExcel(req, res) {
    try {
        const filterMonth = req.query.month ? parseInt(req.query.month, 10) : null;
        const filterYear  = req.query.year  ? parseInt(req.query.year,  10) : null;

        let records = (filterMonth && filterYear)
            ? await VisaTransaction.getByMonthYear(filterMonth, filterYear)
            : await VisaTransaction.getAll();

        // Sort by departure date descending (newest first, matching traditional format)
        records.sort((a, b) => {
            const da = dayjs(a.departureDate, 'DD/MM/YYYY', true);
            const db = dayjs(b.departureDate, 'DD/MM/YYYY', true);
            return (da.isValid() && db.isValid()) ? db.valueOf() - da.valueOf() : 0;
        });

        const MONTH_LABELS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        let monthBandLabel = 'ALL RECORDS';
        let filenameSlug   = new Date().toISOString().slice(0, 10);
        if (filterMonth && filterYear) {
            monthBandLabel = `${MONTH_LABELS[filterMonth].toUpperCase()} ${filterYear}`;
            filenameSlug   = `${MONTH_LABELS[filterMonth].slice(0, 3).toLowerCase()}-${filterYear}`;
        } else if (filterYear) {
            monthBandLabel = String(filterYear);
            filenameSlug   = String(filterYear);
        }

        const fmt = (n) => {
            if (n === 0 || !n) return '₱-';
            const abs = Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return n < 0 ? `-₱${abs}` : `₱${abs}`;
        };

        const COLS     = ['A','B','C','D','E','F','G','H','I','J','K'];
        const HEADERS  = ['Ref No.', 'Transaction', 'Agents', 'Status', 'No. of Pax',
                          'Total SOA', 'Total PO', 'Net Profit', 'SOA No.', 'Departure', 'Area'];
        const COL_COUNT = HEADERS.length;

        const totals = records.reduce(
            (acc, r) => { acc.pax += r.numberOfPax || 0; acc.soa += r.totalSOA || 0;
                          acc.po  += r.totalPO     || 0; acc.profit += r.netProfit || 0; return acc; },
            { pax: 0, soa: 0, po: 0, profit: 0 }
        );

        const aoa = [
            // Row 1: company title
            ['TRADEWINGS TOURS & TRAVEL CORP. — VISA ANALYTICS', ...new Array(COL_COUNT - 1).fill('')],
            // Row 2: month band
            [monthBandLabel, ...new Array(COL_COUNT - 1).fill('')],
            // Row 3: headers
            HEADERS,
            // Data rows
            ...records.map(r => [
                r.refNo || '', r.transactionType || 'Visa', r.agentName || '', r.status || '',
                r.numberOfPax || 0, fmt(r.totalSOA), fmt(r.totalPO), fmt(r.netProfit),
                r.soaNumber || '', r.departureDate || '', r.area || '',
            ]),
            // Totals row
            ['', '', '', '', totals.pax, fmt(totals.soa), fmt(totals.po), fmt(totals.profit), '', '', ''],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(aoa, { sheetStubs: true });
        const workbook  = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Visa Transactions');

        worksheet['!cols']       = [{ wch:12 },{ wch:12 },{ wch:42 },{ wch:12 },{ wch:10 },
                                    { wch:16 },{ wch:16 },{ wch:16 },{ wch:14 },{ wch:13 },{ wch:16 }];
        worksheet['!freeze']     = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activePane: 'bottomLeft' };
        worksheet['!merges']     = [{ s:{ r:0,c:0 }, e:{ r:0,c:COL_COUNT-1 } },
                                    { s:{ r:1,c:0 }, e:{ r:1,c:COL_COUNT-1 } }];
        worksheet['!autofilter'] = { ref: 'A3:K3' };
        worksheet['!rows']       = [{ hpt:22 },{ hpt:18 },{ hpt:20 }];

        const gridBorder = {
            top:    { style:'thin', color:{ rgb:'1F1F1F' } },
            bottom: { style:'thin', color:{ rgb:'1F1F1F' } },
            left:   { style:'thin', color:{ rgb:'1F1F1F' } },
            right:  { style:'thin', color:{ rgb:'1F1F1F' } },
        };

        // Row 1: company title
        for (const [i, col] of COLS.entries()) {
            const ref = `${col}1`;
            if (!worksheet[ref]) worksheet[ref] = { t:'s', v:'' };
            worksheet[ref].s = i === 0
                ? { font:{ bold:true, color:{ rgb:'FFFFFF' }, sz:14, name:'Calibri' },
                    fill:{ fgColor:{ rgb:'0B2447' }, patternType:'solid' },
                    alignment:{ horizontal:'center', vertical:'center' }, border: gridBorder }
                : { fill:{ fgColor:{ rgb:'0B2447' }, patternType:'solid' }, border: gridBorder };
        }

        // Row 2: month band
        for (const [i, col] of COLS.entries()) {
            const ref = `${col}2`;
            if (!worksheet[ref]) worksheet[ref] = { t:'s', v:'' };
            worksheet[ref].s = i === 0
                ? { font:{ bold:true, color:{ rgb:'FFFFFF' }, sz:13, name:'Calibri' },
                    fill:{ fgColor:{ rgb:'19376D' }, patternType:'solid' },
                    alignment:{ horizontal:'center', vertical:'center' }, border: gridBorder }
                : { fill:{ fgColor:{ rgb:'19376D' }, patternType:'solid' }, border: gridBorder };
        }

        // Row 3: headers
        for (const col of COLS) {
            const ref = `${col}3`;
            if (worksheet[ref]) {
                worksheet[ref].s = {
                    font:      { bold:true, color:{ rgb:'FFFFFF' }, sz:11, name:'Calibri' },
                    fill:      { fgColor:{ rgb:'0B2447' }, patternType:'solid' },
                    alignment: { horizontal:'center', vertical:'center', wrapText:false },
                    border:    gridBorder,
                };
            }
        }

        // Data rows: alternating white / light blue
        const lastDataRow = records.length + 3; // 1-based
        for (let r = 4; r <= lastDataRow; r++) {
            const bg = (r % 2 === 0) ? 'EBF4FF' : null;
            for (const col of COLS) {
                const ref = `${col}${r}`;
                if (!worksheet[ref]) worksheet[ref] = { t:'s', v:'' };
                worksheet[ref].s = {
                    font:      { sz:10, color:{ rgb:'000000' }, name:'Calibri' },
                    fill:      bg ? { fgColor:{ rgb:bg }, patternType:'solid' } : undefined,
                    alignment: { horizontal:'left', vertical:'center', wrapText:false },
                    border:    gridBorder,
                };
            }
        }

        // Totals row: yellow
        const totalsRowIdx = records.length + 4;
        for (const col of COLS) {
            const ref = `${col}${totalsRowIdx}`;
            if (!worksheet[ref]) worksheet[ref] = { t:'s', v:'' };
            worksheet[ref].s = {
                font:      { bold:true, sz:10, color:{ rgb:'000000' }, name:'Calibri' },
                fill:      { fgColor:{ rgb:'FFFF00' }, patternType:'solid' },
                alignment: { horizontal:'center', vertical:'center', wrapText:false },
                border:    gridBorder,
            };
        }

        const buffer   = XLSX.write(workbook, { type:'buffer', bookType:'xlsx' });
        const filename = `visa-analytics-${filenameSlug}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}