import multer from "multer";

import path from "path";

import fs from "fs";

const storageDir = path.join(process.cwd(), "file_storage");

// Ensure storage directory exists
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const storage: multer.StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storageDir)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }
})

// const upload = multer({
//     storage : storage,
//     fileFilter : (req , file , cb) => {
//         const extname = path.extname(file.originalname);
//         if(extname !== ".pdf"){
//             cb("Only PDF files are allowed");
//         }
//         cb(null, true);
//     }
// });

export default upload;