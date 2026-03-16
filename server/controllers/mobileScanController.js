import * as PendingScan from '../models/PendingScan.js';
import * as Passport from '../models/Passport.js';
import { scanUploadSchema, confirmScanSchema } from '../schemas/mobileScanSchema.js';
import { scanAndCreatePending } from '../services/mobileScanService.js';

function normalizePayment(value) {
   if (value === undefined || value === null) return '';
   const x = String(value).trim().toLowerCase();
   if (!x || x === '0') return '';
   return x;
    }

export async function extractFromMobile(req, res) {
    try {
        const parsed = scanUploadSchema.safeParse(req.body || {});
        if (!parsed.success && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payload. Provide multipart image or imageBase64.',
                details: parsed.error?.issues || [],
            });
        }

        const {pending, extracted} = await scanAndCreatePending(req);

        return res.status(201).json({
            success: true,
            data: {
                scanId: pending.scanId,
                status: pending.status,
                imageUrl: pending.imageUrl,
                extracted,
            },
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process mobile scan',
        });
    }
}

export async function listPendingMobile(req, res) {
    try {
        const scans = await PendingScan.getAllPending();
        scans.sort((a,b) => new Date(b.scannedAt)- new Date(a.scannedAt));
        return res.status(200).json({success: true, data: scans});

    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
}

export async function confirmMobileScan(req, res) {
    try {
        const {scanId} = req.params;
        const parsed = confirmScanSchema.safeParse(req.body || {});

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid confirmation payload',
                details: parsed.error.issues,
            });
        }


        const scan = await PendingScan.findById(scanId);
        if (!scan) {
            return res.status(404).json({success: false, error: 'Pending scan not found'});
        }

        const payment = normalizePayment(parsed.data.payment);

        if (payment && !['partial', 'paid'].includes(payment)) {
            return res.status(400).json({success: false, error: 'Invalid payment value'});
        }

         const passportPayload = {
            surname: scan.surname || '',
            firstName: scan.firstName || '',
            middleName: scan.middleName || '',
            dateOfBirth: scan.dateOfBirth || '',
            passportNumber: scan.passportNumber || '',
            dateOfIssue: scan.dateOfIssue || '',
            dateOfExpiry: scan.dateOfExpiry || '',
            portalRefNo: parsed.data.portalRefNo,
            agency: parsed.data.agency,
            embassy: parsed.data.embassy,
            appointmentDate: parsed.data.appointmentDate,
            appointmentTime: parsed.data.appointmentTime,
            departureDate: parsed.data.departureDate,
            tourName: parsed.data.tourName,
            payment,
            createdBy: req.user?.email || 'unknown',
        };

        const saved = await Passport.create(passportPayload);
        await PendingScan.remove(scanId);

        return res.status(201).json({
            success: true,
            data: saved,
            message: 'Pending scan confirmed and saved to passports'
        })


    } catch (error) {
        return res.status(500).json({success: false, error: error.message});
    }
} 

export async function deleteMobileScan(req,res) {
    try {
        const {scanId} = req.params;
        const existing = await PendingScan.findById(scanId);
        if (!existing) {
            return res.status(404).json({success: false, error: 'Pending scan not found'});
        }
        await PendingScan.remove(scanId);
        return res.status(200).json({success: true, message: 'Pending scan removed'});
    } catch (error) {
        return res.status(500).json({success: false, error: error.message})
    }
}
