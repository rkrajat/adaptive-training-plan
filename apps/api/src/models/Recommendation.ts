import mongoose, { type Document, Schema } from "mongoose";

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  trainingPlanId: mongoose.Types.ObjectId;
  weekNumber: number;
  content: string;
  athleteInputFeedback?: string;
  isRegenerated: boolean;
  previousRecommendationId?: mongoose.Types.ObjectId;
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

export const Recommendation = mongoose.model<IRecommendation>(
  "Recommendation",
  recommendationSchema,
);
