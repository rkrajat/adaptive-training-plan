import mongoose, { type Document, Schema } from 'mongoose';
import type { ITrainingPlanMetadata } from './TrainingPlan';

export interface ITrainingPlanVersion extends Document {
  trainingPlanId: mongoose.Types.ObjectId;
  versionNumber: number;
  csvContent: string;
  metadata: ITrainingPlanMetadata;
  changeType: 'created' | 'updated' | 'ai_modified';
  changeDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const trainingPlanVersionMetadataSchema = new Schema<ITrainingPlanMetadata>(
  {
    name: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
    },
    raceName: {
      type: String,
    },
    raceDate: {
      type: Date,
    },
    raceDistance: {
      type: String,
    },
    targetTime: {
      type: String,
    },
  },
  { _id: false }
);

const trainingPlanVersionSchema = new Schema<ITrainingPlanVersion>(
  {
    trainingPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingPlan',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    csvContent: {
      type: String,
      required: true,
    },
    metadata: {
      type: trainingPlanVersionMetadataSchema,
      required: true,
    },
    changeType: {
      type: String,
      enum: ['created', 'updated', 'ai_modified'],
      required: true,
    },
    changeDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for version lookups (descending order for latest first)
trainingPlanVersionSchema.index({ trainingPlanId: 1, versionNumber: -1 });

// Index for time-based queries
trainingPlanVersionSchema.index({ createdAt: -1 });

// Unique constraint: one version number per plan
trainingPlanVersionSchema.index(
  { trainingPlanId: 1, versionNumber: 1 },
  { unique: true }
);

export const TrainingPlanVersion = mongoose.model<ITrainingPlanVersion>(
  'TrainingPlanVersion',
  trainingPlanVersionSchema
);
