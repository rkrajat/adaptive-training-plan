import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Feedback } from "../models/Feedback";
import { Recommendation } from "../models/Recommendation";
import { withSpan, TELEMETRY_EVENTS } from "../telemetry";
import { log } from "../utils/logger";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendInternalError,
  sendForbidden,
} from "../utils/response";

/**
 * Send a 409 Conflict error
 */
const sendConflict = (res: Response, error: string): void => {
  res.status(409).json({ error });
};

/**
 * Submit feedback for a recommendation
 * POST /api/feedback
 */
export const submitFeedback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendBadRequest(res, "User ID is required");
      return;
    }

    const { recommendationId, usefulnessRating, wouldFollow, comment } =
      req.body;

    // Validate recommendationId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recommendationId)) {
      sendBadRequest(res, "Invalid recommendation ID");
      return;
    }

    // Verify recommendation exists
    const recommendation = await Recommendation.findById(recommendationId);

    if (!recommendation) {
      sendNotFound(res, "Recommendation not found");
      return;
    }

    // Verify recommendation belongs to authenticated user
    if (recommendation.userId.toString() !== userId) {
      sendForbidden(res, "This recommendation does not belong to you");
      return;
    }

    // Check for duplicate feedback
    const existingFeedback = await Feedback.findOne({
      userId,
      recommendationId,
    });

    if (existingFeedback) {
      sendConflict(res, "Feedback already submitted for this recommendation");
      return;
    }

    // Create and save feedback with telemetry
    const feedback = await withSpan(
      TELEMETRY_EVENTS.FEEDBACK_SUBMIT,
      async () => {
        const newFeedback = new Feedback({
          userId,
          recommendationId,
          usefulnessRating,
          wouldFollow,
          comment: comment || null,
        });
        await newFeedback.save();
        return newFeedback;
      },
      {
        "user.id": userId,
        "recommendation.id": recommendationId,
        "rating": usefulnessRating,
        "would_follow": wouldFollow,
        "has_comment": !!comment,
      }
    );

    log.info("Feedback submitted successfully", {
      feedbackId: feedback._id,
      userId,
      recommendationId,
      usefulnessRating,
    });

    sendCreated(
      res,
      {
        id: feedback._id,
        userId: feedback.userId,
        recommendationId: feedback.recommendationId,
        usefulnessRating: feedback.usefulnessRating,
        wouldFollow: feedback.wouldFollow,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      },
      "Feedback submitted successfully",
    );
  } catch (error) {
    log.error("Error submitting feedback", error);

    // Handle duplicate key error (from unique index)
    if (error instanceof Error && "code" in error && error.code === 11000) {
      sendConflict(res, "Feedback already submitted for this recommendation");
      return;
    }

    // Handle validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      sendBadRequest(res, "Validation error", error.errors);
      return;
    }

    sendInternalError(res, "Failed to submit feedback");
  }
};

/**
 * Check if user has submitted feedback for a recommendation
 * GET /api/feedback/status/:recommendationId
 */
export const checkFeedbackStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { recommendationId } = req.params;

    if (!userId) {
      sendBadRequest(res, "User ID is required");
      return;
    }

    // Validate recommendationId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recommendationId)) {
      sendBadRequest(res, "Invalid recommendation ID");
      return;
    }

    const feedback = await Feedback.findOne({
      userId,
      recommendationId,
    });

    sendSuccess(res, {
      hasSubmitted: !!feedback,
    });
  } catch (error) {
    log.error("Error checking feedback status", error);
    sendInternalError(res, "Failed to check feedback status");
  }
};

/**
 * Get all feedback for a recommendation (admin only)
 * GET /api/feedback/recommendation/:recommendationId
 */
export const getRecommendationFeedback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { recommendationId } = req.params;

    // Validate recommendationId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recommendationId)) {
      sendBadRequest(res, "Invalid recommendation ID");
      return;
    }

    const feedbacks = await Feedback.find({
      recommendationId,
    })
      .sort({ createdAt: -1 })
      .populate("userId", "firstName lastName profilePhoto");

    if (!feedbacks || feedbacks.length === 0) {
      sendNotFound(res, "No feedback found for this recommendation");
      return;
    }

    log.info("Recommendation feedback retrieved", {
      recommendationId,
      count: feedbacks.length,
    });

    sendSuccess(res, {
      feedbacks: feedbacks.map((feedback) => ({
        id: feedback._id,
        userId: feedback.userId,
        recommendationId: feedback.recommendationId,
        usefulnessRating: feedback.usefulnessRating,
        wouldFollow: feedback.wouldFollow,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      })),
    });
  } catch (error) {
    log.error("Error retrieving recommendation feedback", error);
    sendInternalError(res, "Failed to retrieve feedback");
  }
};
