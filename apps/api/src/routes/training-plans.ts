import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { validateParams } from '../middleware/validate';
import { trainingPlanService } from '../services/training-plan.service';
import {
  trainingPlanUploadSchema,
  trainingPlanIdParamSchema,
  listTrainingPlansQuerySchema,
} from '../validators/training-plan.validator';
import { log } from '../utils/logger';
import {
  sendSuccess,
  sendCreated,
  sendInternalError,
  sendBadRequest,
} from '../utils/response';
import { AppError } from '../utils/error';

const router = Router();

// Configure multer for in-memory file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// POST /api/training-plans - Upload a new training plan
router.post(
  '/',
  authenticateJWT,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'User not authenticated');
        return;
      }

      if (!req.file) {
        sendBadRequest(res, 'No file uploaded');
        return;
      }

      // Validate request body
      const validationResult = trainingPlanUploadSchema.safeParse(req.body);

      if (!validationResult.success) {
        sendBadRequest(res, validationResult.error.issues[0].message);
        return;
      }

      const metadata = validationResult.data;

      // Create training plan
      const trainingPlan = await trainingPlanService.createTrainingPlan(
        req.user.userId,
        req.file,
        metadata
      );

      log.info('Training plan uploaded successfully', {
        userId: req.user.userId,
        planId: trainingPlan.id,
      });

      sendCreated(res, trainingPlan, 'Training plan uploaded successfully');
    } catch (error) {
      log.error('Error uploading training plan', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, 'Failed to upload training plan');
    }
  }
);

// GET /api/training-plans - List all training plans for authenticated user
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendBadRequest(res, 'User not authenticated');
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
    log.error('Error fetching training plans', error);
    sendInternalError(res, 'Failed to fetch training plans');
  }
});

// GET /api/training-plans/:id - Get specific training plan by ID
router.get(
  '/:id',
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'User not authenticated');
        return;
      }

      const { id } = req.params;

      const trainingPlan = await trainingPlanService.getTrainingPlan(
        id,
        req.user.userId
      );

      sendSuccess(res, trainingPlan);
    } catch (error) {
      log.error('Error fetching training plan', error, { planId: req.params.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, 'Failed to fetch training plan');
    }
  }
);

// GET /api/training-plans/:id/versions - Get training plan with all versions
router.get(
  '/:id/versions',
  authenticateJWT,
  validateParams(trainingPlanIdParamSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'User not authenticated');
        return;
      }

      const { id } = req.params;

      const result = await trainingPlanService.getTrainingPlanWithVersions(
        id,
        req.user.userId
      );

      sendSuccess(res, result);
    } catch (error) {
      log.error('Error fetching training plan with versions', error, {
        planId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      sendInternalError(res, 'Failed to fetch training plan with versions');
    }
  }
);

export { router as trainingPlansRouter };
