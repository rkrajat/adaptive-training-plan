import { getCurrentWeekNumber } from "@adaptive-training-plan/utils";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Recommendation } from "../models/Recommendation";
import { log } from "../utils/logger";
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
  sendForbidden,
  sendBadRequest,
  sendUnauthorized,
} from "../utils/response";

/**
 * Get a single recommendation by ID
 * GET /api/recommendations/:id
 */
export const getRecommendationById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendBadRequest(res, "Invalid recommendation ID format");
      return;
    }

    // Find recommendation with trainingPlan population
    const recommendation = await Recommendation.findById(id).populate(
      "trainingPlanId",
      "metadata.name startDate"
    );

    if (!recommendation) {
      sendNotFound(res, "Recommendation not found");
      return;
    }

    // Verify ownership
    if (recommendation.userId.toString() !== userId) {
      sendForbidden(
        res,
        "Access denied: This recommendation does not belong to you"
      );
      return;
    }

    // Type assertion for populated training plan
    const trainingPlan = recommendation.trainingPlanId as unknown as {
      _id: mongoose.Types.ObjectId;
      metadata: { name: string };
      startDate: Date;
    };

    // Calculate current week dynamically
    const currentWeek = getCurrentWeekNumber(trainingPlan.startDate);

    sendSuccess(res, {
      id: recommendation._id,
      userId: recommendation.userId,
      trainingPlan: {
        id: trainingPlan._id,
        name: trainingPlan.metadata.name,
        currentWeek,
      },
      weekNumber: recommendation.weekNumber,
      content: recommendation.content,
      athleteInputFeedback: recommendation.athleteInputFeedback,
      isRegenerated: recommendation.isRegenerated,
      previousRecommendationId: recommendation.previousRecommendationId,
      createdAt: recommendation.createdAt,
      updatedAt: recommendation.updatedAt,
    });
  } catch (error) {
    log.error("Error fetching recommendation", error);
    sendInternalError(res, "Failed to fetch recommendation");
  }
};

/**
 * Get user's recommendation history with optional filtering
 * GET /api/recommendations/user/history
 */
export const getUserRecommendationHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    // Parse and validate query parameters
    const {
      trainingPlanId,
      weekNumber,
      limit = "20",
      offset = "0",
    } = req.query;

    const queryLimit = Math.min(Number(limit), 100);
    const queryOffset = Number(offset);

    // Build query filter
    const filter: {
      userId: string;
      trainingPlanId?: string;
      weekNumber?: number;
    } = { userId };

    if (trainingPlanId) {
      if (!mongoose.Types.ObjectId.isValid(trainingPlanId as string)) {
        sendBadRequest(res, "Invalid trainingPlanId format");
        return;
      }
      filter.trainingPlanId = trainingPlanId as string;
    }

    if (weekNumber) {
      const weekNum = Number(weekNumber);
      if (!Number.isInteger(weekNum) || weekNum < 1) {
        sendBadRequest(res, "Invalid weekNumber: must be positive integer");
        return;
      }
      filter.weekNumber = weekNum;
    }

    // Get total count
    const total = await Recommendation.countDocuments(filter);

    // Fetch recommendations (exclude content field for performance)
    const recommendations = await Recommendation.find(filter)
      .select("-athleteInputFeedback -previousRecommendationId")
      .populate("trainingPlanId", "metadata.name")
      .sort({ createdAt: -1 })
      .skip(queryOffset)
      .limit(queryLimit)
      .lean();

    // Format response with content preview
    const recommendationsWithPreview = recommendations.map((rec) => {
      const trainingPlan = rec.trainingPlanId as unknown as {
        _id: mongoose.Types.ObjectId;
        metadata: { name: string };
      };

      return {
        id: rec._id,
        trainingPlan: {
          id: trainingPlan._id,
          name: trainingPlan.metadata.name,
        },
        weekNumber: rec.weekNumber,
        contentPreview: rec.content?.substring(0, 200) || "",
        isRegenerated: rec.isRegenerated,
        createdAt: rec.createdAt,
      };
    });

    sendSuccess(res, {
      recommendations: recommendationsWithPreview,
      pagination: {
        total,
        limit: queryLimit,
        offset: queryOffset,
        hasMore: queryOffset + queryLimit < total,
      },
    });
  } catch (error) {
    log.error("Error fetching recommendation history", error);
    sendInternalError(res, "Failed to fetch recommendation history");
  }
};
