import { Router , type Request , type Response } from "express";
import upload from "./MulterMiddleware.js";
import { indexing } from "../rag/pipeline.js";

const router : Router = Router();

const handleUploadPdf = async (req: Request , res: Response) =>{
    try {
        const file : Express.Multer.File | undefined = req.file;
        if(!file){
            return res.status(400).json({message : "No file uploaded"});
        }

        // Trigger indexing immediately after upload
        // In a real production app, you might want to do this in the background
        await indexing(file.path);

        res.status(200).json({message : "File uploaded and indexed successfully", path: file.path});
    } catch (error) {
        console.log("Error in UploadRouter.ts : handleUploadPdf : ", error);
        return res.status(500).json({message : "Internal server error"});
    }
}

router.post("/upload-pdf" , upload.single("file") , handleUploadPdf);

export default router;