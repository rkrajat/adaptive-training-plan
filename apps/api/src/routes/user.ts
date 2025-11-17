import { Router } from 'express';

import { getUserProfile, updateExperienceLevel } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
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

export const userRouter = router;
