import * as Passport from '../models/Passport.js'
import * as PendingScan from '../models/PendingScan.js'
import { incrementRecordCount } from '../services/sessionService.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const isValidYear = (y) => Number.isInteger(y) && y >= 1900 && y <= 2200;
const isValidMonth = (m) => Number.isInteger(m) && m >= 0 && m <= 11;

function normalizePaymentValue(value) {
    if (value === undefined || value === null) return '';
    const normalized = String(value).trim().toLowerCase();
    if (!normalized || normalized === '0') return '';
    return normalized;
}

function normaliseMigrationFields(data) {
    const mode = String(data.entryMode || 'normal').toLowerCase();
    data.entryMode = mode === 'migration' ? 'migration' : 'normal';

    const monthRaw = data.migrationMonth;
    const yearRaw = data.migrationYear;

    const month = monthRaw === '' || monthRaw === null || monthRaw === undefined
        ? null
        : parseInt(monthRaw, 10);
    const year = yearRaw === '' || yearRaw === null || yearRaw === undefined
        ? null
        : parseInt(yearRaw, 10);

    data.migrationMonth = Number.isNaN(month) ? null : month;
    data.migrationYear = Number.isNaN(year) ? null : year;
}

//Get all passport record
export async function getAll(req,res){
    try {
        const records = await Passport.getAll();
        return res.status(200).json({success: true, data: records});
    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}

//get single passport record
export async function getById(req, res){
    try {
        const {passportId} = req.params;
        const record = await Passport.findById(passportId);
        if (!record) {
            return res.status(404).json({success:false, error: "Record not found."});
        }
        return res.status(200).json({success:true, data: record});
    } catch (error) {
        return res.status(500).json({success:false, error: error.message});
    }
}

//create new passport record
export async function create(req,res){
    try {
        const data = req.body;
        normaliseMigrationFields(data);

        // Required fields
        if (!data.surname || !data.firstName || !data.passportNumber) {
            return res.status(400).json({
                success:false,
                error: "Surname, First Name, and Passport Number are required.",
            });
        }
        if (!data.portalRefNo || !String(data.portalRefNo).trim()) {
            return res.status(400).json({ success:false, error: "Portal Ref No is required." });
        }
        if (data.entryMode === 'migration') {
            if (!isValidMonth(data.migrationMonth) || !isValidYear(data.migrationYear)) {
                return res.status(400).json({ success:false, error: 'Migration mode requires valid month and year.' });
            }
        } else {
            data.migrationMonth = null;
            data.migrationYear = null;
        }

        // Payment enum validation
        data.payment = normalizePaymentValue(data.payment);
        if (data.payment && !['unpaid','partial','paid'].includes(data.payment)) {
            return res.status(400).json({ success:false, error: "Payment must be unpaid, partial, or paid." });
        }

        // Date cross-validations (only when both sides are provided)
        if (data.dateOfBirth && data.dateOfIssue) {
            const dob = dayjs(data.dateOfBirth, 'DD/MM/YYYY', true);
            const doi = dayjs(data.dateOfIssue, 'DD/MM/YYYY', true);
            if (dob.isValid() && doi.isValid() && dob.isSameOrAfter(doi)) {
                return res.status(400).json({ success:false, error: "Date of Birth must be before Date of Issue." });
            }
        }
        if (data.dateOfIssue && data.dateOfExpiry) {
            const doi = dayjs(data.dateOfIssue, 'DD/MM/YYYY', true);
            const doe = dayjs(data.dateOfExpiry, 'DD/MM/YYYY', true);
            if (doi.isValid() && doe.isValid() && doi.isSameOrAfter(doe)) {
                return res.status(400).json({ success:false, error: "Date of Issue must be before Date of Expiry." });
            }
        }
        if (data.appointmentDate && data.departureDate) {
            const appt = dayjs(data.appointmentDate, 'DD/MM/YYYY', true);
            const dep = dayjs(data.departureDate, 'DD/MM/YYYY', true);
            if (appt.isValid() && dep.isValid() && appt.isSameOrAfter(dep)) {
                return res.status(400).json({ success:false, error: "Appointment Date must be before Departure Date." });
            }
        }

        //Attach who saved this record
        data.createdBy = req.user?.email || "unknown";

        const record = await Passport.create(data);

        // Track records added in this session for logout notification
        if (req.user?.email) incrementRecordCount(req.user.email);

        return res.status(201).json({success: true, data: record});

    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}

//update passport record
export async function update(req,res){
    try {
        const {passportId} = req.params;
        const data = req.body;
        normaliseMigrationFields(data);

        const existing = await Passport.findById(passportId);
        if(!existing){
            return res.status(404).json({success:false, error: "Record not found."});
        }

        // Required fields
        if (data.surname !== undefined && !String(data.surname).trim())
            return res.status(400).json({ success:false, error: "Surname is required." });
        if (data.firstName !== undefined && !String(data.firstName).trim())
            return res.status(400).json({ success:false, error: "First Name is required." });
        if (data.passportNumber !== undefined && !String(data.passportNumber).trim())
            return res.status(400).json({ success:false, error: "Passport Number is required." });

        // Normalize payment before validating (blank/0 => unpaid)
        data.payment = normalizePaymentValue(data.payment);
        if (data.payment && !['unpaid','partial','paid'].includes(data.payment))
            return res.status(400).json({ success:false, error: "Payment must be unpaid, partial, or paid." });

        if (data.entryMode === 'migration') {
            const existingMonth = Number.isInteger(existing.migrationMonth) ? existing.migrationMonth : parseInt(existing.migrationMonth, 10);
            const existingYear = Number.isInteger(existing.migrationYear) ? existing.migrationYear : parseInt(existing.migrationYear, 10);
            const monthToUse = data.migrationMonth === null ? (Number.isNaN(existingMonth) ? null : existingMonth) : data.migrationMonth;
            const yearToUse = data.migrationYear === null ? (Number.isNaN(existingYear) ? null : existingYear) : data.migrationYear;
            if (!isValidMonth(monthToUse) || !isValidYear(yearToUse)) {
                return res.status(400).json({ success:false, error: 'Migration mode requires valid month and year.' });
            }
            data.migrationMonth = monthToUse;
            data.migrationYear = yearToUse;
        } else {
            data.migrationMonth = null;
            data.migrationYear = null;
        }

        // Resolve effective dates (merge with existing for cross-field checks)
        const dob  = data.dateOfBirth    ?? existing.dateOfBirth;
        const doi  = data.dateOfIssue    ?? existing.dateOfIssue;
        const doe  = data.dateOfExpiry   ?? existing.dateOfExpiry;
        const appt = data.appointmentDate ?? existing.appointmentDate;
        const dep  = data.departureDate  ?? existing.departureDate;

        // Only validate date relationships if user is updating one of those fields
        // This allows partial updates (e.g., just embassy) to succeed
        if ((data.dateOfBirth || data.dateOfIssue) && dob && doi) {
            const dobParsed = dayjs(dob, 'DD/MM/YYYY', true);
            const doiParsed = dayjs(doi, 'DD/MM/YYYY', true);
            if (dobParsed.isValid() && doiParsed.isValid() && dobParsed.isSameOrAfter(doiParsed)) {
                return res.status(400).json({ success:false, error: "Date of Birth must be before Date of Issue." });
            }
        }
        if ((data.dateOfIssue || data.dateOfExpiry) && doi && doe) {
            const doiParsed = dayjs(doi, 'DD/MM/YYYY', true);
            const doeParsed = dayjs(doe, 'DD/MM/YYYY', true);
            if (doiParsed.isValid() && doeParsed.isValid() && doiParsed.isSameOrAfter(doeParsed)) {
                return res.status(400).json({ success:false, error: "Date of Issue must be before Date of Expiry." });
            }
        }
        if ((data.appointmentDate || data.departureDate) && appt && dep) {
            const apptParsed = dayjs(appt, 'DD/MM/YYYY', true);
            const depParsed = dayjs(dep, 'DD/MM/YYYY', true);
            if (apptParsed.isValid() && depParsed.isValid() && apptParsed.isSameOrAfter(depParsed)) {
                return res.status(400).json({ success:false, error: "Appointment Date must be before Departure Date." });
            }
        }

        const updated = await Passport.update(passportId, data);
        return res.status(200).json({success: true, data: updated});

    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}

//delete passport record
export async function remove(req,res){
    try {
        const {passportId} = req.params;
        const existing = await Passport.findById(passportId);

        if (!existing) {
            return res.status(404).json({success: false, error: "Record not found."});
        }

        await Passport.remove(passportId);
        return res.status(200).json({success: true, message: "Record Deleted Successfully."});

    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}