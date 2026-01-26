import { Router, type Request, type Response } from "express";
import multer from "multer";

import { authenticateJWT } from "../middleware/auth";
import { validateParams } from "../middleware/validate";
import { trainingPlanService } from "../services/training-plan.service";
import type { TrainingPlanUploadRequest } from "../types/api.types";
import { AppError } from "../utils/error";
import { log } from "../utils/logger";
import {
  sendSuccess,
  sendCreated,
  sendInternalError,
  sendBadRequest,
} from "../utils/response";
import {
  trainingPlanUploadSchema,
  trainingPlanIdParamSchema,
  listTrainingPlansQuerySchema,
  updateStartDateSchema,
} from "../validators/training-plan.validator";

const router = Router();

// Configure multer for in-memory file upload
// Support both CSV (5MB) and PDF (10MB) files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (max for PDF files)
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV and PDF files
    const allowedMimeTypes = [
      "text/csv",
      "application/csv",
      "text/plain",
      "application/pdf",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV and PDF files are allowed"));
    }
  },
});

// POST /api/training-plans - Upload a new training plan
router.post(
  "/",
  authenticateJWT,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, "User not authenticated");
        return;
      }

      if (!req.file) {
        sendBadRequest(res, "No file uploaded");
        return;
      }

      // Validate request body
      const validationResult = trainingPlanUploadSchema.safeParse(req.body);

      if (!validationResult.success) {
        sendBadRequest(res, validationResult.error.issues[0].message);
        return;
      }

      // Type assertion - the schema validates raceGoal is present via refine()
      const metadata = validationResult.data as TrainingPlanUploadRequest;

      // Detect file type based on MIME type
      const pdfMimeTypes = ["application/pdf"];
      const csvMimeTypes = ["text/csv", "application/csv", "text/plain"];

      let fileType: "csv" | "pdf" = "csv";
      if (pdfMimeTypes.includes(req.file.mimetype)) {
        fileType = "pdf";
      } else if (csvMimeTypes.includes(req.file.mimetype)) {
        fileType = "csv";
      }

      log.info("Processing training plan upload", {
        userId: req.user.userId,
        fileType,
        filename: req.file.originalname,
      });

      // Create training plan
      const trainingPlan = await trainingPlanService.createTrainingPlan(
        req.user.userId,
        req.file,
        metadata,
        fileType
      );

      log.info("Training plan uploaded successfully", {
        userId: req.user.userId,
        planId: trainingPlan.id,
      });

      sendCreated(res, trainingPlan, "Training plan uploaded successfully");
    } catch (error) {
      log.error("Error uploading training plan", error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, "Failed to upload training plan");
    }
  }
);

// GET /api/training-plans - List all training plans for authenticated user
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendBadRequest(res, "User not authenticated");
      return;
    }

    // Validate query parameters
    const queryValidation = listTrainingPlansQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      sendBadRequest(res, queryValidation.error.issues[0].message);
      return;
    }

    const { isActive } = queryValidation.data;

    // Fetch training plans
    const result = await trainingPlanService.getUserTrainingPlans(
      req.user.userId,
      isActive
    );

    sendSuccess(res, result);
  } catch (error) {
    log.error("Error fetching training plans", error);
    sendInternalError(res, "Failed to fetch training plans");
  }
});

// GET /api/training-plans/:id - Get specific training plan by ID
router.get(
  "/:id",
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, "User not authenticated");
        return;
      }

      const { id } = req.params;

      const trainingPlan = await trainingPlanService.getTrainingPlan(
        id,
        req.user.userId
      );

      sendSuccess(res, trainingPlan);
    } catch (error) {
      log.error("Error fetching training plan", error, {
        planId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, "Failed to fetch training plan");
    }
  }
);

// GET /api/training-plans/:id/versions - Get training plan with all versions
router.get(
  "/:id/versions",
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, "User not authenticated");
        return;
      }

      const { id } = req.params;

      const result = await trainingPlanService.getTrainingPlanWithVersions(
        id,
        req.user.userId
      );

      sendSuccess(res, result);
    } catch (error) {
      log.error("Error fetching training plan with versions", error, {
        planId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, "Failed to fetch training plan with versions");
    }
  }
);

// PATCH /api/training-plans/:id - Update training plan start date
router.patch(
  "/:id",
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, "User not authenticated");
        return;
      }

      const { id } = req.params;

      // Validate request body
      const validationResult = updateStartDateSchema.safeParse(req.body);

      if (!validationResult.success) {
        sendBadRequest(res, validationResult.error.issues[0].message);
        return;
      }

      const { startDate } = validationResult.data;

      await trainingPlanService.updateStartDate(
        id,
        req.user.userId,
        startDate
      );

      log.info("Training plan start date updated successfully", {
        userId: req.user.userId,
        planId: id,
      });

      sendSuccess(res, { message: "Start date updated successfully" });
    } catch (error) {
      log.error("Error updating training plan start date", error, {
        planId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, "Failed to update start date");
    }
  }
);

// DELETE /api/training-plans/:id - Delete training plan
router.delete(
  "/:id",
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, "User not authenticated");
        return;
      }

      const { id } = req.params;

      await trainingPlanService.deleteTrainingPlan(id, req.user.userId);

      log.info("Training plan deleted successfully", {
        userId: req.user.userId,
        planId: id,
      });

      sendSuccess(res, { message: "Training plan deleted successfully" });
    } catch (error) {
      log.error("Error deleting training plan", error, {
        planId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, "Failed to delete training plan");
    }
  }
);

export { router as trainingPlansRouter };
