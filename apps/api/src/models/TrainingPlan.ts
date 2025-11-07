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
  currentWeek: number;
  startDate: Date;
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
    currentWeek: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
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
