import type { ExperienceLevel } from '@adaptive-training-plan/types';
import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser extends Document {
  stravaId: number;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  experienceLevel?: ExperienceLevel;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  stravaTokenExpiresAt?: Date;
  lastActivitySyncAt?: Date;
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
    stravaAccessToken: {
      type: String,
    },
    stravaRefreshToken: {
      type: String,
    },
    stravaTokenExpiresAt: {
      type: Date,
    },
    lastActivitySyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
