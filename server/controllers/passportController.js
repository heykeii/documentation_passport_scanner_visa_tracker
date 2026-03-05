import * as Passport from '../models/Passport.js'
import * as PendingScan from '../models/PendingScan.js'

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

        // Payment enum validation
        if (data.payment) data.payment = String(data.payment).toLowerCase().trim();
        if (data.payment && !['unpaid','partial','paid'].includes(data.payment)) {
            return res.status(400).json({ success:false, error: "Payment must be unpaid, partial, or paid." });
        }

        // Date cross-validations (only when both sides are provided)
        if (data.dateOfBirth && data.dateOfIssue && new Date(data.dateOfBirth) >= new Date(data.dateOfIssue)) {
            return res.status(400).json({ success:false, error: "Date of Birth must be before Date of Issue." });
        }
        if (data.dateOfIssue && data.dateOfExpiry && new Date(data.dateOfIssue) >= new Date(data.dateOfExpiry)) {
            return res.status(400).json({ success:false, error: "Date of Issue must be before Date of Expiry." });
        }
        if (data.appointmentDate && data.departureDate && new Date(data.appointmentDate) >= new Date(data.departureDate)) {
            return res.status(400).json({ success:false, error: "Appointment Date must be before Departure Date." });
        }

        //Attach who saved this record
        data.createdBy = req.user?.email || "unknown";

        const record = await Passport.create(data);
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

        // Normalize payment to lowercase before validating
        if (data.payment) data.payment = String(data.payment).toLowerCase().trim();
        if (data.payment && !['unpaid','partial','paid'].includes(data.payment))
            return res.status(400).json({ success:false, error: "Payment must be unpaid, partial, or paid." });

        // Resolve effective dates (merge with existing for cross-field checks)
        const dob  = data.dateOfBirth    ?? existing.dateOfBirth;
        const doi  = data.dateOfIssue    ?? existing.dateOfIssue;
        const doe  = data.dateOfExpiry   ?? existing.dateOfExpiry;
        const appt = data.appointmentDate ?? existing.appointmentDate;
        const dep  = data.departureDate  ?? existing.departureDate;

        // Only validate date relationships if user is updating one of those fields
        // This allows partial updates (e.g., just embassy) to succeed
        if ((data.dateOfBirth || data.dateOfIssue) && dob && doi && new Date(dob) >= new Date(doi))
            return res.status(400).json({ success:false, error: "Date of Birth must be before Date of Issue." });
        if ((data.dateOfIssue || data.dateOfExpiry) && doi && doe && new Date(doi) >= new Date(doe))
            return res.status(400).json({ success:false, error: "Date of Issue must be before Date of Expiry." });
        if ((data.appointmentDate || data.departureDate) && appt && dep && new Date(appt) >= new Date(dep))
            return res.status(400).json({ success:false, error: "Appointment Date must be before Departure Date." });

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