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
        //basic valdation
        if (!data.surname || !data.firstName || !data.passportNumber) {
            return res.status(400).json({
                success:false,
                error: "Surname, First Name, and Passport Number are required.",
            });
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