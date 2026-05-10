import * as dotenv from "dotenv";
dotenv.config();

import {default as uploadRouter} from "./uploads/UploadRouter.js";
import {default as ragRouter} from "./rag/APIRouter.js";

const port : string = process.env.PORT || "8000";

import express, { type Express } from "express";
import cors from "cors";

const app : Express = express();

const allowedOrigins = [
    "https://notebook-lm-v0.vercel.app",
    "http://localhost:5173", // Vite default
    "http://localhost:3000"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));
app.use(express.json());

app.use("/api" , uploadRouter);
app.use("/api/rag" , ragRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
