import type {
  ActiveRecommendation,
  RejectAction,
} from "@adaptive-training-plan/types";
import mongoose from "mongoose";

import { config } from "../config";
import {
  Recommendation,
  type IRecommendation,
} from "../models/Recommendation";
import { invalidateUserRecommendationCache } from "../utils/cache";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/error";
import { log } from "../utils/logger";

/**
 * Recommendation Acceptance Service
 * Handles accept/reject operations and active recommendation queries
 */
export class RecommendationAcceptanceService {
  /**
   * Calculate expiry date based on configured day of week
   * Sets expiry to 23:59:59.999 UTC on the next occurrence of the configured day
   */
  calculateExpiryDate = (fromDate: Date = new Date()): Date => {
    const expiryDayOfWeek = config.recommendation.expiryDayOfWeek;
    const currentDay = fromDate.getUTCDay();

    // Calculate days until next expiry day
    let daysUntilExpiry = expiryDayOfWeek - currentDay;
    if (daysUntilExpiry <= 0) {
      // If today is the expiry day or past it, go to next week
      daysUntilExpiry += 7;
    }

    const expiryDate = new Date(fromDate);
    expiryDate.setUTCDate(expiryDate.getUTCDate() + daysUntilExpiry);
    expiryDate.setUTCHours(23, 59, 59, 999);

    return expiryDate;
  };

  /**
   * Check if a recommendation has expired based on current time
   */
  isRecommendationStale = (recommendation: IRecommendation): boolean => {
    if (recommendation.status !== "accepted" || !recommendation.expiresAt) {
      return false;
    }
    return new Date() > recommendation.expiresAt;
  };

  /**
   * Get active (accepted and not expired) recommendation for a user
   * Returns null if no active recommendation exists
   */
  getActiveRecommendation = async (
    userId: string
  ): Promise<ActiveRecommendation | null> => {
    try {
      log.info("Fetching active recommendation", { userId });

      const now = new Date();

      const recommendation = await Recommendation.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        status: "accepted",
        expiresAt: { $gt: now },
      }).sort({ acceptedAt: -1 });

      if (!recommendation) {
        log.info("No active recommendation found", { userId });
        return null;
      }

      log.info("Active recommendation found", {
        userId,
        recommendationId: recommendation._id,
      });

      return this.formatRecommendationResponse(recommendation);
    } catch (error) {
      log.error("Failed to fetch active recommendation", error, { userId });
      throw error;
    }
  };

  /**
   * Accept a recommendation
   * Sets status to accepted, records timestamp, calculates expiry
   * Automatically rejects any previously active recommendation for the user
   */
  acceptRecommendation = async (
    recommendationId: string,
    userId: string
  ): Promise<ActiveRecommendation> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      log.info("Accepting recommendation", { recommendationId, userId });

      // Find the recommendation
      const recommendation = await Recommendation.findById(
        recommendationId
      ).session(session);

      if (!recommendation) {
        throw new NotFoundError("Recommendation not found");
      }

      // Verify ownership
      if (recommendation.userId.toString() !== userId) {
        throw new ForbiddenError(
          "You do not have permission to accept this recommendation"
        );
      }

      // Verify it's pending
      if (recommendation.status !== "pending") {
        throw new BadRequestError(
          `Cannot accept recommendation with status '${recommendation.status}'`
        );
      }

      // Reject any existing active recommendation for this user
      const now = new Date();
      await Recommendation.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          status: "accepted",
          expiresAt: { $gt: now },
          _id: { $ne: recommendation._id },
        },
        {
          $set: {
            status: "rejected",
            rejectedAt: now,
          },
        },
        { session }
      );

      // Accept the recommendation
      const expiryDate = this.calculateExpiryDate(now);
      recommendation.status = "accepted";
      recommendation.acceptedAt = now;
      recommendation.expiresAt = expiryDate;
      await recommendation.save({ session });

      await session.commitTransaction();

      log.info("Recommendation accepted successfully", {
        recommendationId,
        userId,
        expiresAt: expiryDate.toISOString(),
      });

      return this.formatRecommendationResponse(recommendation);
    } catch (error) {
      await session.abortTransaction();
      log.error("Failed to accept recommendation", error, {
        recommendationId,
        userId,
      });

      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  };

  /**
   * Reject a recommendation
   * Sets status to rejected and records timestamp
   * Returns the action to be taken (generate_new or discard)
   * Invalidates cache if action is "generate_new"
   */
  rejectRecommendation = async (
    recommendationId: string,
    userId: string,
    action: RejectAction
  ): Promise<{ success: boolean; action: RejectAction }> => {
    try {
      log.info("Rejecting recommendation", {
        recommendationId,
        userId,
        action,
      });

      // Find the recommendation
      const recommendation = await Recommendation.findById(recommendationId);

      if (!recommendation) {
        throw new NotFoundError("Recommendation not found");
      }

      // Verify ownership
      if (recommendation.userId.toString() !== userId) {
        throw new ForbiddenError(
          "You do not have permission to reject this recommendation"
        );
      }

      // Verify it's pending
      if (recommendation.status !== "pending") {
        throw new BadRequestError(
          `Cannot reject recommendation with status '${recommendation.status}'`
        );
      }

      // Reject the recommendation
      const now = new Date();
      recommendation.status = "rejected";
      recommendation.rejectedAt = now;
      await recommendation.save();

      // Invalidate cache if action is "generate_new"
      if (action === "generate_new") {
        invalidateUserRecommendationCache(
          userId,
          String(recommendation.trainingPlanId),
          recommendation.weekNumber
        );
        log.info("Cache invalidated for generate_new action", {
          userId,
          planId: recommendation.trainingPlanId,
          weekNumber: recommendation.weekNumber,
        });
      }

      log.info("Recommendation rejected successfully", {
        recommendationId,
        userId,
        action,
      });

      return { success: true, action };
    } catch (error) {
      log.error("Failed to reject recommendation", error, {
        recommendationId,
        userId,
      });

      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }

      throw error;
    }
  };

  /**
   * Check if user has an active (accepted and not expired) recommendation
   */
  hasActiveRecommendation = async (userId: string): Promise<boolean> => {
    const active = await this.getActiveRecommendation(userId);
    return active !== null;
  };

  /**
   * Format recommendation for API response
   */
  private formatRecommendationResponse = (
    recommendation: IRecommendation
  ): ActiveRecommendation => {
    return {
      id: String(recommendation._id),
      userId: recommendation.userId.toString(),
      trainingPlanId: recommendation.trainingPlanId.toString(),
      weekNumber: recommendation.weekNumber,
      content: recommendation.content,
      status: recommendation.status,
      acceptedAt: recommendation.acceptedAt?.toISOString() ?? null,
      expiresAt: recommendation.expiresAt?.toISOString() ?? null,
      createdAt: recommendation.createdAt.toISOString(),
    };
  };
}

// Export singleton instance
export const recommendationAcceptanceService =
  new RecommendationAcceptanceService();
