import multer from 'multer';

const storage = multer.memoryStorage();
const maxMb = Number(process.env.MOBILE_SCAN_MAX_MB || 10);

const mobileUpload = multer({
    storage,
    limits: {
        fileSize: maxMb * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPEG/JPG/PNG/WEBP images are allowed'), false);
        }
        return cb(null, true);
    },
});

export default mobileUpload;