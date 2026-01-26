import { Router } from 'express';

import {
  getUserProfile,
  updateExperienceLevel,
  getUserPaces,
  updateRaceGoal,
} from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateRaceGoalSchema } from '../validators/race-goal.validator';
import { updateExperienceLevelSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticateJWT);

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

export const userRouter = router;
