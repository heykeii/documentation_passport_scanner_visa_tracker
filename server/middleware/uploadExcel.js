import multer from "multer";

const storage = multer.memoryStorage();

const uploadExcel = multer({
    storage,
    limits: {fileSize: 10 * 1024 *1024}, //10MB
    
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed.)'), false);
        }
    },
})
          export default uploadExcel;