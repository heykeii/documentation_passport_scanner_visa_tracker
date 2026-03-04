import { success } from 'zod';
import * as PendingScan from '../models/PendingScan.js';

export async function getAllPending(req,res){
    try {
        const scans = await PendingScan.getAllPending();

        //sort newest first
        scans.sort((a,b) => new Date(b.scannedAt) - new Date(a.scannedAt));
        return res.status(200).json({success:true, data: scans})

    } catch (error) {
        return res.status(500).json({success:false, error: error.message});
    }
}

//create a pending scan (called by mobile device) 
export async function create(req,res) {
    try {
        const data = req.body;

        if (!data.passportNumber) {
            return res.status(400).json({
                success:false,
                error: "Passport Number is Required.",
            });
        }

        const scan = await PendingScan.create(data);
        return res.status(201).json({success:true, data:scan});

    } catch (error) {
        return res.status(500).json({success:false, error: error.message});
    }
}

// delete a pending scan'
export async function remove(req,res) {
    try {
        const {scanId} = req.params;
        const existing = await PendingScan.findById(scanId);

        if (!existing) {
            return res.status(404).json({success:false, error: "Pending scan not found."});
        }
        await PendingScan.remove(scanId);
        return res.status(200).json({success:true, message: "Pending scan removed."})

    } catch (error) {
        return res.status(500).json({success:false, error: error.message});
    }
}

