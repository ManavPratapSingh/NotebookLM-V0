import { Router } from "express";
import { queryPipeline } from "./pipeline.js";

const router: Router = Router();

router.post("/query", async (req, res) => {
    try {
        const { userQuery } = req.body;
        if (!userQuery) {
            return res.status(400).json({ message: "No query provided" });
        }
        const result = await queryPipeline(userQuery);
        res.json({ response: result });
    } catch (error) {
        console.error("Error in APIRouter.ts : /query : ", error);
        res.status(500).json({ message: "Error processing query" });
    }
});

export default router;