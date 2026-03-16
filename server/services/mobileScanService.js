import cloudinary from '../config/cloudinary.js';
import * as PendingScan from '../models/PendingScan.js';
import { getImageFromRequest } from './imageIngestionService.js';
import { extractPassportFieldsFromImageUrl } from './openaiPassportExtractionService.js';
import { normalizeExtractedPassport } from './passportNormalizationService.js';


function uploadBufferToCloudinary(buffer, folder = 'passport_scans/mobile') {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {folder, resource_type: 'image'},
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

export async function scanAndCreatePending(req) {
    const { buffer, mimeType, originalName } = getImageFromRequest(req);

    const uploaded = await uploadBufferToCloudinary(buffer);
    const imageUrl = uploaded?.secure_url || '';

    if (!imageUrl) {
        throw new Error('Image upload failed');
    }

    const extracted = await extractPassportFieldsFromImageUrl(imageUrl);
    const normalized = normalizeExtractedPassport(extracted);

    const pending = await PendingScan.create({
        ...normalized,
        imageUrl,
        source: 'mobile',
        confidence: normalized.confidence || {},
        status: 'pending',
        scannedBy: req.user?.email || 'unknown',
        mimeType,
        originalFileName: originalName,
    });

    return {pending, extracted: normalized};
}