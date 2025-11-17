# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-13-recommendation-feedback/spec.md

> Created: 2025-11-13
> Version: 1.0.0

## Endpoints

### 1. Submit Feedback

**Endpoint:** `POST /api/feedback`

**Description:** Submit feedback for a specific training recommendation

**Authentication:** Required (JWT token in Authorization header)

**Rate Limiting:** 10 requests per minute per user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recommendationId": "507f1f77bcf86cd799439011",
  "usefulnessRating": 4,
  "wouldFollow": true,
  "comment": "Great recommendation! The pacing suggestions align well with my current fitness level."
}
```

**Request Schema (Zod):**
```typescript
import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  recommendationId: z.string()
    .min(1, 'Recommendation ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid recommendation ID format'),
  usefulnessRating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  wouldFollow: z.boolean({
    required_error: 'Would follow response is required',
    invalid_type_error: 'Would follow must be a boolean',
  }),
  comment: z.string()
    .max(1000, 'Comment must not exceed 1000 characters')
    .trim()
    .optional(),
});

export type SubmitFeedbackRequest = z.infer<typeof submitFeedbackSchema>;
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "feedbackId": "507f1f77bcf86cd799439012",
    "message": "Feedback submitted successfully"
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid feedback data",
    "details": [
      {
        "field": "usefulnessRating",
        "message": "Rating must be between 1 and 5"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found - Recommendation doesn't exist:**
```json
{
  "success": false,
  "error": {
    "code": "RECOMMENDATION_NOT_FOUND",
    "message": "The specified recommendation does not exist"
  }
}
```

**409 Conflict - Duplicate feedback:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_FEEDBACK",
    "message": "Feedback already submitted for this recommendation",
    "details": {
      "existingFeedbackId": "507f1f77bcf86cd799439013"
    }
  }
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many feedback submissions. Please try again later.",
    "retryAfter": 45
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while saving feedback"
  }
}
```

---

### 2. Check Feedback Status

**Endpoint:** `GET /api/feedback/status/:recommendationId`

**Description:** Check if the authenticated user has already submitted feedback for a specific recommendation

**Authentication:** Required (JWT token in Authorization header)

**Rate Limiting:** 30 requests per minute per user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `recommendationId` (string, required): The ID of the recommendation to check

**Success Response (200 OK) - Feedback exists:**
```json
{
  "success": true,
  "data": {
    "hasFeedback": true,
    "feedbackId": "507f1f77bcf86cd799439012",
    "submittedAt": "2025-11-13T14:30:00.000Z"
  }
}
```

**Success Response (200 OK) - No feedback:**
```json
{
  "success": true,
  "data": {
    "hasFeedback": false
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "RECOMMENDATION_NOT_FOUND",
    "message": "The specified recommendation does not exist"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to check feedback status"
  }
}
```

---

### 3. Get Recommendation Feedback (Optional - For Admin/Analytics)

**Endpoint:** `GET /api/feedback/recommendation/:recommendationId`

**Description:** Retrieve all feedback for a specific recommendation (admin only)

**Authentication:** Required (JWT token with admin role)

**Rate Limiting:** 20 requests per minute per user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Results per page (default: 20, max: 100)
- `sort` (string, optional): Sort order - "newest" or "oldest" (default: "newest")

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "feedbackId": "507f1f77bcf86cd799439012",
        "userId": "507f1f77bcf86cd799439010",
        "usefulnessRating": 4,
        "wouldFollow": true,
        "comment": "Great recommendation!",
        "submittedAt": "2025-11-13T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalResults": 45,
      "resultsPerPage": 20
    },
    "summary": {
      "averageRating": 4.2,
      "totalResponses": 45,
      "wouldFollowPercentage": 78.5
    }
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

## Controllers

### FeedbackController

**File:** `apps/api/src/controllers/FeedbackController.ts`

**Class Definition:**

```typescript
import { Request, Response, NextFunction } from 'express';
import { submitFeedbackSchema } from '../schemas/feedback-schema';
import Feedback from '../models/Feedback';
import Recommendation from '../models/Recommendation';

interface AuthenticatedRequest extends Request {
  userId?: string; // Set by authentication middleware
}

export class FeedbackController {
  /**
   * Submit feedback for a recommendation
   * POST /api/feedback
   */
  static async submitFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Validate request body
      const validatedData = submitFeedbackSchema.parse(req.body);
      const { recommendationId, usefulnessRating, wouldFollow, comment } = validatedData;
      const userId = req.userId!; // Guaranteed by auth middleware

      // 2. Verify recommendation exists
      const recommendation = await Recommendation.findById(recommendationId);
      if (!recommendation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECOMMENDATION_NOT_FOUND',
            message: 'The specified recommendation does not exist',
          },
        });
        return;
      }

      // 3. Check for existing feedback (duplicate prevention)
      const existingFeedback = await Feedback.findOne({
        userId,
        recommendationId,
      });

      if (existingFeedback) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_FEEDBACK',
            message: 'Feedback already submitted for this recommendation',
            details: {
              existingFeedbackId: existingFeedback._id,
            },
          },
        });
        return;
      }

      // 4. Create feedback document
      const feedback = await Feedback.create({
        recommendationId,
        userId,
        usefulnessRating,
        wouldFollow,
        comment: comment || null,
      });

      // 5. Return success response
      res.status(201).json({
        success: true,
        data: {
          feedbackId: feedback._id,
          message: 'Feedback submitted successfully',
        },
      });
    } catch (error) {
      next(error); // Pass to error handling middleware
    }
  }

  /**
   * Check if user has submitted feedback for a recommendation
   * GET /api/feedback/status/:recommendationId
   */
  static async checkFeedbackStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const userId = req.userId!;

      // Validate recommendationId format
      if (!/^[0-9a-fA-F]{24}$/.test(recommendationId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RECOMMENDATION_ID',
            message: 'Invalid recommendation ID format',
          },
        });
        return;
      }

      // Verify recommendation exists
      const recommendation = await Recommendation.findById(recommendationId);
      if (!recommendation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECOMMENDATION_NOT_FOUND',
            message: 'The specified recommendation does not exist',
          },
        });
        return;
      }

      // Check for existing feedback
      const feedback = await Feedback.findOne({
        userId,
        recommendationId,
      });

      if (feedback) {
        res.status(200).json({
          success: true,
          data: {
            hasFeedback: true,
            feedbackId: feedback._id,
            submittedAt: feedback.createdAt,
          },
        });
      } else {
        res.status(200).json({
          success: true,
          data: {
            hasFeedback: false,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all feedback for a recommendation (admin only)
   * GET /api/feedback/recommendation/:recommendationId
   */
  static async getRecommendationFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sort = req.query.sort === 'oldest' ? 1 : -1; // Default to newest

      const skip = (page - 1) * limit;

      // Get feedbacks with pagination
      const feedbacks = await Feedback.find({ recommendationId })
        .sort({ createdAt: sort })
        .skip(skip)
        .limit(limit)
        .select('-__v');

      // Get total count for pagination
      const totalResults = await Feedback.countDocuments({ recommendationId });

      // Calculate summary statistics
      const stats = await Feedback.aggregate([
        { $match: { recommendationId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$usefulnessRating' },
            totalResponses: { $sum: 1 },
            wouldFollowCount: {
              $sum: { $cond: ['$wouldFollow', 1, 0] },
            },
          },
        },
      ]);

      const summary = stats[0] || {
        averageRating: 0,
        totalResponses: 0,
        wouldFollowCount: 0,
      };

      res.status(200).json({
        success: true,
        data: {
          feedbacks: feedbacks.map(f => ({
            feedbackId: f._id,
            userId: f.userId,
            usefulnessRating: f.usefulnessRating,
            wouldFollow: f.wouldFollow,
            comment: f.comment,
            submittedAt: f.createdAt,
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalResults / limit),
            totalResults,
            resultsPerPage: limit,
          },
          summary: {
            averageRating: Math.round(summary.averageRating * 10) / 10,
            totalResponses: summary.totalResponses,
            wouldFollowPercentage:
              summary.totalResponses > 0
                ? Math.round((summary.wouldFollowCount / summary.totalResponses) * 1000) / 10
                : 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Routes Configuration

**File:** `apps/api/src/routes/feedback-routes.ts`

```typescript
import { Router } from 'express';
import { FeedbackController } from '../controllers/FeedbackController';
import { authenticateUser } from '../middleware/auth-middleware';
import { requireAdmin } from '../middleware/admin-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';
import { submitFeedbackSchema } from '../schemas/feedback-schema';

const router = Router();

// Submit feedback (authenticated users)
router.post(
  '/',
  authenticateUser,
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }), // 10 per minute
  validateRequest(submitFeedbackSchema),
  FeedbackController.submitFeedback
);

// Check feedback status (authenticated users)
router.get(
  '/status/:recommendationId',
  authenticateUser,
  rateLimitMiddleware({ maxRequests: 30, windowMs: 60000 }), // 30 per minute
  FeedbackController.checkFeedbackStatus
);

// Get recommendation feedback (admin only)
router.get(
  '/recommendation/:recommendationId',
  authenticateUser,
  requireAdmin,
  rateLimitMiddleware({ maxRequests: 20, windowMs: 60000 }), // 20 per minute
  FeedbackController.getRecommendationFeedback
);

export default router;
```

## Error Handling

### Global Error Handler Middleware

**File:** `apps/api/src/middleware/error-handler-middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid feedback data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
    });
    return;
  }

  // MongoDB duplicate key error (E11000)
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_FEEDBACK',
        message: 'Feedback already submitted for this recommendation',
      },
    });
    return;
  }

  // MongoDB CastError (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
      },
    });
    return;
  }

  // Default server error
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

### Validation Middleware

**File:** `apps/api/src/middleware/validation-middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error); // Pass to error handler
    }
  };
};
```

## Testing

### Unit Tests

**File:** `apps/api/src/controllers/FeedbackController.test.ts`

```typescript
import { FeedbackController } from './FeedbackController';
import Feedback from '../models/Feedback';
import Recommendation from '../models/Recommendation';
import { mockRequest, mockResponse } from '../test-utils/express-mocks';

describe('FeedbackController', () => {
  describe('submitFeedback', () => {
    it('should create feedback successfully', async () => {
      const req = mockRequest({
        body: {
          recommendationId: '507f1f77bcf86cd799439011',
          usefulnessRating: 4,
          wouldFollow: true,
          comment: 'Great!',
        },
        userId: '507f1f77bcf86cd799439010',
      });
      const res = mockResponse();

      await FeedbackController.submitFeedback(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            feedbackId: expect.any(String),
          }),
        })
      );
    });

    it('should return 409 for duplicate feedback', async () => {
      // Test duplicate submission logic
    });
  });
});
```
