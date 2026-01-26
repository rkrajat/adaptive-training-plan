import mongoose, { Schema } from "mongoose";

import type { IActivity } from "../types/activity.types";

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stravaActivityId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    movingTime: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    averageHeartrate: {
      type: Number,
      default: null,
    },
    syncedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "activities",
  }
);

// Compound unique index for deduplication (one activity per user per Strava activity)
activitySchema.index({ userId: 1, stravaActivityId: 1 }, { unique: true });

// Compound index for efficient retrieval by user and date
activitySchema.index({ userId: 1, startDate: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
