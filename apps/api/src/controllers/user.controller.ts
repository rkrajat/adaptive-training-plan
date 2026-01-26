import type { RaceDistance } from '@adaptive-training-plan/types';
import type { Request, Response } from 'express';

import { User } from '../models/User';
import { vdotService } from '../services/vdot.service';
import { log } from '../utils/logger';
import { formatTrainingPaces } from '../utils/pace-formatter';
import { sendSuccess, sendNotFound, sendInternalError } from '../utils/response';

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

/**
 * Get user training paces
 * GET /api/users/paces
 */
export const getUserPaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendNotFound(res, 'User not found');
      return;
    }

    const user = await User.findById(userId).select('raceGoal');

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    if (!user.raceGoal) {
      sendSuccess(res, {
        raceGoal: null,
        paces: null,
        formatted: null,
      });
      return;
    }

    const formatted = formatTrainingPaces(user.raceGoal.paces);

    sendSuccess(res, {
      raceGoal: {
        distance: user.raceGoal.distance,
        distanceLabel: user.raceGoal.distanceLabel,
        targetTimeSeconds: user.raceGoal.targetTimeSeconds,
        vdot: user.raceGoal.vdot,
        calculatedAt: user.raceGoal.calculatedAt.toISOString(),
      },
      paces: user.raceGoal.paces,
      formatted,
    });
  } catch (error) {
    log.error('Error fetching user paces', error);
    sendInternalError(res, 'Failed to fetch user paces');
  }
};

/**
 * Update user race goal and recalculate paces
 * PUT /api/users/race-goal
 */
export const updateRaceGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { raceGoal: raceGoalInput } = req.body;

    if (!userId) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Calculate new VDOT and training paces
    const raceGoal = vdotService.createRaceGoal(
      raceGoalInput.distance as RaceDistance,
      raceGoalInput.targetTimeSeconds
    );

    const user = await User.findByIdAndUpdate(
      userId,
      { raceGoal },
      { new: true, runValidators: true }
    ).select('raceGoal');

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    log.info('User race goal updated', {
      userId,
      distance: raceGoal.distanceLabel,
      vdot: raceGoal.vdot,
    });

    const formatted = formatTrainingPaces(raceGoal.paces);

    sendSuccess(res, {
      raceGoal,
      formatted,
    });
  } catch (error) {
    log.error('Error updating race goal', error);
    sendInternalError(res, 'Failed to update race goal');
  }
};
