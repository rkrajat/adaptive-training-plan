import type { Request, Response } from 'express';
import { User } from '../models/User';
import { sendSuccess, sendNotFound, sendInternalError } from '../utils/response';
import { log } from '../utils/logger';

/**
 * Get user profile including experience level
 * GET /api/users/profile
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendNotFound(res, 'User not found');
      return;
    }

    const user = await User.findById(userId).select(
      'stravaId firstName lastName profilePhoto experienceLevel createdAt updatedAt'
    );

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, {
      user: {
        id: user._id,
        stravaId: user.stravaId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        experienceLevel: user.experienceLevel,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    log.error('Error fetching user profile', error);
    sendInternalError(res, 'Failed to fetch user profile');
  }
};

/**
 * Update user experience level
 * PATCH /api/users/profile/experience-level
 */
export const updateExperienceLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { experienceLevel } = req.body;

    if (!userId) {
      sendNotFound(res, 'User not found');
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { experienceLevel },
      { new: true, runValidators: true }
    ).select('stravaId firstName lastName profilePhoto experienceLevel createdAt updatedAt');

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    log.info('User experience level updated', {
      userId,
      experienceLevel,
    });

    sendSuccess(res, {
      user: {
        id: user._id,
        stravaId: user.stravaId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        experienceLevel: user.experienceLevel,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    log.error('Error updating experience level', error);
    sendInternalError(res, 'Failed to update experience level');
  }
};
