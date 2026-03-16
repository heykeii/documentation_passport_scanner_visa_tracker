export function getImageFromRequest(req) {
    if (req.file?.buffer) {
        return {
            buffer: req.file.buffer,
            mimeType: req.file.mimeType || 'image/jpeg',
            originalName: req.file.originalName || 'scan.jpg',
        };
    }

    const b64 =  req.body?.imageBase64;
    if (b64) {
        const pure = b64.includes(',') ? b64.split(',')[1] : 64;
        return {
            buffer: Buffer.from(pure, 'base64'),
            mimeType: 'image/jpeg',
            originalName: 'scan-base64.jpg',
        };
    }

    throw new Error('No image found. Send multipart image or imageBase64');
}