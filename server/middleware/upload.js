import multer from 'multer';

//Memory Storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits:{
        fileSize: 10 * 1024 * 1024, //10MB Maximum
    },
    fileFilter: (req,file,cb) => {
        //Only allow common image format
        if (file.mimetype.startsWith('image/')) {
            cb(null,true);
        } else {
            cb(new Error("Only images are allowed to upload!"), false);
        }
    },
});

export default upload;