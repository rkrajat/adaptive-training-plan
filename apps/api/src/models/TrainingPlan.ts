import type { PaceGroup } from '@adaptive-training-plan/types';
import mongoose, { type Document, Schema } from 'mongoose';

export interface ITrainingPlanMetadata {
  name: string;
  goal?: string;
  raceName?: string;
  raceDate?: Date;
  raceDistance?: string;
  targetTime?: string;
}

export interface ITrainingPlan extends Document {
  userId: mongoose.Types.ObjectId;
  csvContent: string;
  metadata: ITrainingPlanMetadata;
  source: 'user_upload' | 'ai_generated';
  isActive: boolean;
  startDate: Date;
  paceGroups?: PaceGroup[];
  matchedPaceGroupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const trainingPlanMetadataSchema = new Schema<ITrainingPlanMetadata>(
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

// Schema for PaceGroup subdocument
const paceGroupTimeRangeSchema = new Schema(
  {
    minSeconds: { type: Number },
    maxSeconds: { type: Number },
  },
  { _id: false }
);

const paceGroupPacesSchema = new Schema(
  {
    easy: { type: String },
    tempo: { type: String },
    interval: { type: String },
    longRun: { type: String },
    marathon: { type: String },
    threshold: { type: String },
    repetition: { type: String },
    warmUp: { type: String },
    coolDown: { type: String },
  },
  { _id: false, strict: false } // Allow additional pace types
);

const paceGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    timeRange: { type: paceGroupTimeRangeSchema },
    paces: { type: paceGroupPacesSchema, required: true },
  },
  { _id: false }
);

const trainingPlanSchema = new Schema<ITrainingPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    csvContent: {
      type: String,
      required: true,
    },
    metadata: {
      type: trainingPlanMetadataSchema,
      required: true,
    },
    source: {
      type: String,
      enum: ['user_upload', 'ai_generated'],
      required: true,
      default: 'user_upload',
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    paceGroups: {
      type: [paceGroupSchema],
      required: false,
    },
    matchedPaceGroupId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimized queries
trainingPlanSchema.index({ userId: 1, isActive: 1 });

export const TrainingPlan = mongoose.model<ITrainingPlan>(
  'TrainingPlan',
  trainingPlanSchema
);
