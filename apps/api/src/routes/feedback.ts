import { Router } from 'express';

import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { feedbackRateLimiter } from '../middleware/rate-limit';
import {
  submitFeedback,
  checkFeedbackStatus,
  getRecommendationFeedback,
} from '../controllers/feedback.controller';
import { submitFeedbackSchema } from '../validators/feedback.validator';

const router = Router();

// All feedback routes require authentication
router.use(authenticateJWT);

// POST /api/feedback - Submit feedback for a recommendation
router.post(
  '/',
  feedbackRateLimiter,
  validateBody(submitFeedbackSchema),
  submitFeedback
);

// GET /api/feedback/status/:recommendationId - Check if user has submitted feedback
router.get('/status/:recommendationId', checkFeedbackStatus);

// GET /api/feedback/recommendation/:recommendationId - Get all feedback for a recommendation (admin only)
// Note: Admin middleware to be added in future when admin role is implemented
router.get('/recommendation/:recommendationId', getRecommendationFeedback);

export const feedbackRouter = router;
