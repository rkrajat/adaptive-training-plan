import mongoose from 'mongoose';
import { TrainingPlan, type ITrainingPlan } from '../models/TrainingPlan';
import {
  TrainingPlanVersion,
  type ITrainingPlanVersion,
} from '../models/TrainingPlanVersion';
import { log } from '../utils/logger';
import {
  AppError,
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} from '../utils/error';
import { parseCsvBuffer } from '../utils/csv-parser';
import { validateCsvStructure, validateCsvFile } from '../utils/csv-validator';
import type {
  TrainingPlanResponse,
  TrainingPlanWithContentResponse,
  TrainingPlanWithVersionsResponse,
  TrainingPlanVersionResponse,
  ListTrainingPlansResponse,
  TrainingPlanUploadRequest,
} from '../types/api.types';

/**
 * Training Plan Service
 * Handles training plan CRUD operations and version management
 */
export class TrainingPlanService {
  /**
   * Create a new training plan with initial version
   * Uses MongoDB transactions to ensure atomicity
   */
  async createTrainingPlan(
    userId: string,
    file: Express.Multer.File,
    metadata: TrainingPlanUploadRequest
  ): Promise<TrainingPlanWithContentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      log.info('Creating training plan', { userId, metadata });

      // Validate file
      validateCsvFile(file);

      // Parse and validate CSV content
      const csvContent = parseCsvBuffer(file.buffer);
      validateCsvStructure(csvContent);

      // Create training plan
      const trainingPlanData = {
        userId: new mongoose.Types.ObjectId(userId),
        csvContent,
        metadata: {
          name: metadata.name,
          goal: metadata.goal,
          raceName: metadata.raceName,
          raceDate: metadata.raceDate ? new Date(metadata.raceDate) : undefined,
          raceDistance: metadata.raceDistance,
          targetTime: metadata.targetTime,
        },
        source: 'user_upload' as const,
        isActive: true,
        currentWeek: 1,
        startDate: new Date(),
      };

      const [trainingPlan] = await TrainingPlan.create([trainingPlanData], {
        session,
      });

      log.info('Training plan created', {
        trainingPlanId: trainingPlan._id,
        userId,
      });

      // Create initial version
      const versionData = {
        trainingPlanId: trainingPlan._id as mongoose.Types.ObjectId,
        versionNumber: 1,
        csvContent,
        metadata: trainingPlan.metadata,
        changeType: 'created' as const,
        changeDescription: 'Initial plan upload',
      };

      await TrainingPlanVersion.create([versionData], { session });

      log.info('Initial version created', {
        trainingPlanId: trainingPlan._id,
        versionNumber: 1,
      });

      // Commit transaction
      await session.commitTransaction();

      return this.formatTrainingPlanWithContent(trainingPlan);
    } catch (error) {
      await session.abortTransaction();
      log.error('Failed to create training plan', error, { userId });

      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Failed to create training plan', error);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get training plan by ID
   */
  async getTrainingPlan(
    planId: string,
    userId: string
  ): Promise<TrainingPlanWithContentResponse> {
    try {
      log.info('Fetching training plan', { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError('Training plan not found');
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          'You do not have permission to access this training plan'
        );
      }

      return this.formatTrainingPlanWithContent(trainingPlan);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      log.error('Failed to fetch training plan', error, { planId, userId });
      throw new InternalServerError('Failed to fetch training plan', error);
    }
  }

  /**
   * Get all training plans for a user
   */
  async getUserTrainingPlans(
    userId: string,
    isActive?: boolean
  ): Promise<ListTrainingPlansResponse> {
    try {
      log.info('Fetching user training plans', { userId, isActive });

      const query: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
      };

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const trainingPlans = await TrainingPlan.find(query).sort({
        createdAt: -1,
      });

      return {
        plans: trainingPlans.map((plan) => this.formatTrainingPlan(plan)),
      };
    } catch (error) {
      log.error('Failed to fetch user training plans', error, { userId });
      throw new InternalServerError(
        'Failed to fetch user training plans',
        error
      );
    }
  }

  /**
   * Get training plan with all versions
   */
  async getTrainingPlanWithVersions(
    planId: string,
    userId: string
  ): Promise<TrainingPlanWithVersionsResponse> {
    try {
      log.info('Fetching training plan with versions', { planId, userId });

      const trainingPlan = await TrainingPlan.findById(planId);

      if (!trainingPlan) {
        throw new NotFoundError('Training plan not found');
      }

      // Verify ownership
      if (String(trainingPlan.userId) !== userId) {
        throw new ForbiddenError(
          'You do not have permission to access this training plan'
        );
      }

      // Fetch all versions
      const versions = await TrainingPlanVersion.find({
        trainingPlanId: planId,
      }).sort({ versionNumber: -1 });

      return {
        ...this.formatTrainingPlanWithContent(trainingPlan),
        versions: versions.map((version) => this.formatVersion(version)),
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        throw error;
      }
      log.error('Failed to fetch training plan with versions', error, {
        planId,
        userId,
      });
      throw new InternalServerError(
        'Failed to fetch training plan with versions',
        error
      );
    }
  }

  /**
   * Format training plan for API response (without CSV content)
   */
  private formatTrainingPlan(plan: ITrainingPlan): TrainingPlanResponse {
    return {
      id: String(plan._id),
      userId: String(plan.userId),
      metadata: {
        name: plan.metadata.name,
        goal: plan.metadata.goal,
        raceName: plan.metadata.raceName,
        raceDate: plan.metadata.raceDate?.toISOString(),
        raceDistance: plan.metadata.raceDistance,
        targetTime: plan.metadata.targetTime,
      },
      source: plan.source,
      isActive: plan.isActive,
      currentWeek: plan.currentWeek,
      startDate: plan.startDate.toISOString(),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  /**
   * Format training plan with CSV content for API response
   */
  private formatTrainingPlanWithContent(
    plan: ITrainingPlan
  ): TrainingPlanWithContentResponse {
    return {
      ...this.formatTrainingPlan(plan),
      csvContent: plan.csvContent,
    };
  }

  /**
   * Format training plan version for API response
   */
  private formatVersion(
    version: ITrainingPlanVersion
  ): TrainingPlanVersionResponse {
    return {
      id: String(version._id),
      trainingPlanId: String(version.trainingPlanId),
      versionNumber: version.versionNumber,
      metadata: {
        name: version.metadata.name,
        goal: version.metadata.goal,
        raceName: version.metadata.raceName,
        raceDate: version.metadata.raceDate?.toISOString(),
        raceDistance: version.metadata.raceDistance,
        targetTime: version.metadata.targetTime,
      },
      changeType: version.changeType,
      changeDescription: version.changeDescription,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance
export const trainingPlanService = new TrainingPlanService();
