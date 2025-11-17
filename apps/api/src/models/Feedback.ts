import mongoose, { type Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  recommendationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  usefulnessRating: number;
  wouldFollow: boolean;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: 'Recommendation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    usefulnessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Usefulness rating must be an integer',
      },
    },
    wouldFollow: {
      type: Boolean,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'feedbacks',
  }
);

// Compound unique index to prevent duplicate feedback
feedbackSchema.index(
  { userId: 1, recommendationId: 1 },
  { unique: true, name: 'unique_user_recommendation_feedback' }
);

// Index for efficient querying by recommendation (for analytics)
feedbackSchema.index(
  { recommendationId: 1, createdAt: -1 },
  { name: 'recommendation_date_index' }
);

// Index for efficient user feedback history queries
feedbackSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'user_feedback_history_index' }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
