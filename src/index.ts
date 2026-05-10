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
    "https://notebook-lm-v0.vercel.app/",
    "http://localhost:5173",
    "http://localhost:3000"
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());

// Log every request to help debugging
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

app.use("/api" , uploadRouter);
app.use("/api/rag" , ragRouter);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

app.listen(Number(port), "0.0.0.0", () => {
    console.log(`Server is running on port ${port} and bound to 0.0.0.0`);
});
