import { Router , type Request , type Response } from "express";
import upload from "./MulterMiddleware.js";

const router : Router = Router();

const handleUploadPdf = async (req: Request , res: Response) =>{
    try {
        const file : Express.Multer.File | undefined = req.file;
        if(!file){
            return res.status(400).json({message : "No file uploaded"});
        }
        res.status(200).json({message : "File uploaded successfully"});
    } catch (error) {
        console.log("Error in UploadRouter.ts : handleUploadPdf : ", JSON.stringify(error));
        return res.status(500).json({message : "Internal server error"});
    }
}

router.post("/upload-pdf" , upload.single("file") , handleUploadPdf);

export default router;