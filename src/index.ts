import * as dotenv from "dotenv";
dotenv.config();

import {default as uploadRouter} from "./uploads/UploadRouter.js";
import {default as ragRouter} from "./rag/APIRouter.js";

const port : string = process.env.PORT || "8000";

import express, { type Express } from "express";

const app : Express = express();

app.use(express.json());

app.use("/api" , uploadRouter);
app.use("/api/rag" , ragRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
