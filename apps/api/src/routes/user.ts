import { Router, type Request, type Response } from 'express';

import {
  getUserProfile,
  updateExperienceLevel,
  getUserPaces,
  updateRaceGoal,
} from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth';
import { addTelemetryContext } from '../middleware/telemetry.middleware';
import { validateBody } from '../middleware/validate';
import { stravaService } from '../services/strava.service';
import { sendSuccess, sendUnauthorized } from '../utils/response';
import { updateRaceGoalSchema } from '../validators/race-goal.validator';
import { updateExperienceLevelSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticateJWT);
router.use(addTelemetryContext);

// GET /api/users/profile - Get user profile
router.get('/profile', getUserProfile);

// PATCH /api/users/profile/experience-level - Update experience level
router.patch(
  '/profile/experience-level',
  validateBody(updateExperienceLevelSchema),
  updateExperienceLevel
);

// GET /api/users/paces - Get user training paces
router.get('/paces', getUserPaces);

// PUT /api/users/race-goal - Update race goal and recalculate paces
router.put(
  '/race-goal',
  validateBody(updateRaceGoalSchema),
  updateRaceGoal
);

// POST /api/users/me/refresh-activities - Invalidate cached Strava activities
router.post('/me/refresh-activities', async (req: Request, res: Response) => {
  if (!req.user) {
    sendUnauthorized(res, 'User not authenticated');
    return;
  }

  const invalidated = stravaService.invalidateActivitiesCache(req.user.userId);
  sendSuccess(res, { invalidated });
});

export const userRouter = router;
