import type { RecommendationStatus } from "@adaptive-training-plan/types";
import mongoose, { type Document, Schema } from "mongoose";

// Re-export for convenience
export type { RecommendationStatus } from "@adaptive-training-plan/types";

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  trainingPlanId: mongoose.Types.ObjectId;
  weekNumber: number;
  content: string;
  athleteInputFeedback?: string;
  isRegenerated: boolean;
  previousRecommendationId?: mongoose.Types.ObjectId;
  status: RecommendationStatus;
  acceptedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trainingPlanId: {
      type: Schema.Types.ObjectId,
      ref: "TrainingPlan",
      required: true,
      index: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Week number must be an integer",
      },
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    athleteInputFeedback: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    isRegenerated: {
      type: Boolean,
      default: false,
    },
    previousRecommendationId: {
      type: Schema.Types.ObjectId,
      ref: "Recommendation",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "recommendations",
  },
);

// Compound index for efficient user history queries
recommendationSchema.index(
  { userId: 1, trainingPlanId: 1, weekNumber: 1, createdAt: -1 },
  { name: "user_plan_week_date_index" },
);

// Index for efficient chronological queries
recommendationSchema.index({ createdAt: -1 }, { name: "created_date_index" });

// Compound index for efficient active recommendation queries
recommendationSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: "user_active_recommendation_index" },
);

export const Recommendation = mongoose.model<IRecommendation>(
  "Recommendation",
  recommendationSchema,
);
