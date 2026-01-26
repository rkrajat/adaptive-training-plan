import type {
  ExperienceLevel,
  RaceGoal,
} from '@adaptive-training-plan/types';
import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser extends Document {
  stravaId: number;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  experienceLevel?: ExperienceLevel;
  raceGoal?: RaceGoal;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  stravaTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    stravaId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: false,
    },
    raceGoal: {
      type: {
        distance: {
          type: Number,
          required: true,
        },
        distanceLabel: {
          type: String,
          required: true,
        },
        targetTimeSeconds: {
          type: Number,
          required: true,
        },
        vdot: {
          type: Number,
          required: true,
        },
        paces: {
          easy: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
          longRun: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
          marathon: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
          threshold: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
          interval: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
          repetition: {
            minPace: { type: Number, required: true },
            maxPace: { type: Number, required: true },
          },
        },
        calculatedAt: {
          type: Date,
          required: true,
        },
      },
      required: false,
    },
    stravaAccessToken: {
      type: String,
    },
    stravaRefreshToken: {
      type: String,
    },
    stravaTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
