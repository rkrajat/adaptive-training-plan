import { Router } from "express";

import { getTrainingStatus } from "../controllers/training-status.controller";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// POST /api/training-status - Get training status for authenticated user
router.post("/", authenticateJWT, getTrainingStatus);

export { router as trainingStatusRouter };
