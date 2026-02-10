import ky from "ky";
import type {
  Activity,
  User,
  TrainingPlan,
  TrainingPlanWithContent,
  ExperienceLevel,
  WeeklySummaryData,
  ActiveRecommendationResponse,
  AcceptRecommendationResponse,
  RejectAction,
  RejectRecommendationResponse,
  RaceGoalInput,
} from "@adaptive-training-plan/types";

import { getToken, removeToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Get Authorization header with Bearer token
const getAuthHeader = (): string | undefined => {
  const token = getToken();
  return token ? `Bearer ${token}` : undefined;
};

// Create ky instance with Authorization header
export const api = ky.create({
  prefixUrl: API_URL,
  timeout: 120000, // 2 minutes - matches backend timeout for AI recommendations
  retry: {
    limit: 0, // Disable retries for long-running AI requests
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const authHeader = getAuthHeader();
        if (authHeader) {
          request.headers.set("Authorization", authHeader);
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          removeToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return response;
      },
    ],
  },
});

// API methods
export const authApi = {
  me: async (): Promise<User> => {
    return api.get("api/auth/me").json<User>();
  },
};

export const activitiesApi = {
  list: async (): Promise<{ activities: Activity[] }> => {
    return api.get("api/activities").json<{ activities: Activity[] }>();
  },

  getWeeklySummary: async (
    startDate: string,
    week: number
  ): Promise<WeeklySummaryData> => {
    return api
      .get("api/activities/weekly-summary", {
        searchParams: { startDate, week: week.toString() },
      })
      .json<WeeklySummaryData>();
  },
};

export const trainingPlansApi = {
  list: async (): Promise<{ plans: TrainingPlan[] }> => {
    return api.get("api/training-plans").json<{ plans: TrainingPlan[] }>();
  },

  listActive: async (): Promise<{ plans: TrainingPlanWithContent[] }> => {
    return api
      .get("api/training-plans", { searchParams: { isActive: "true" } })
      .json<{ plans: TrainingPlanWithContent[] }>();
  },

  upload: async (
    file: File,
    metadata: {
      name: string;
      startDate: string;
      goal?: string;
      raceName?: string;
      raceDate?: string;
      raceGoal: RaceGoalInput;
    }
  ): Promise<TrainingPlanWithContent> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", metadata.name);
    formData.append("startDate", metadata.startDate);
    if (metadata.goal) formData.append("goal", metadata.goal);
    if (metadata.raceName) formData.append("raceName", metadata.raceName);
    if (metadata.raceDate) formData.append("raceDate", metadata.raceDate);
    // Send race goal as FormData nested fields
    formData.append("raceGoal[distance]", metadata.raceGoal.distance.toString());
    formData.append("raceGoal[targetTimeSeconds]", metadata.raceGoal.targetTimeSeconds.toString());

    return api
      .post("api/training-plans", { body: formData })
      .json<TrainingPlanWithContent>();
  },

  getById: async (id: string): Promise<TrainingPlanWithContent> => {
    return api.get(`api/training-plans/${id}`).json<TrainingPlanWithContent>();
  },

  updateStartDate: async (
    id: string,
    startDate: string
  ): Promise<TrainingPlanWithContent> => {
    return api
      .patch(`api/training-plans/${id}`, { json: { startDate } })
      .json<TrainingPlanWithContent>();
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`api/training-plans/${id}`);
  },
};

export const recommendationsApi = {
  generateWithPlan: async (planId: string, userFeedback?: string) => {
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/api/recommendations/generate-with-plan`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ planId, userFeedback }),
      }
    );

    return response;
  },

  getActive: async (): Promise<ActiveRecommendationResponse> => {
    return api
      .get("api/recommendations/active")
      .json<ActiveRecommendationResponse>();
  },

  getPending: async (planId: string): Promise<{ content: string; cached: boolean }> => {
    return api
      .get("api/recommendations/pending", {
        searchParams: { planId },
      })
      .json<{ content: string; cached: boolean }>();
  },

  accept: async (recommendationId: string): Promise<AcceptRecommendationResponse> => {
    return api
      .post(`api/recommendations/${recommendationId}/accept`)
      .json<AcceptRecommendationResponse>();
  },

  acceptPending: async (planId: string): Promise<AcceptRecommendationResponse> => {
    return api
      .post("api/recommendations/accept-pending", {
        json: { planId },
      })
      .json<AcceptRecommendationResponse>();
  },

  reject: async (
    recommendationId: string,
    action: RejectAction
  ): Promise<RejectRecommendationResponse> => {
    return api
      .post(`api/recommendations/${recommendationId}/reject`, {
        json: { action },
      })
      .json<RejectRecommendationResponse>();
  },
};

export const userApi = {
  getProfile: async (): Promise<{ user: User }> => {
    return api.get("api/users/profile").json<{ user: User }>();
  },

  updateExperienceLevel: async (
    experienceLevel: ExperienceLevel
  ): Promise<{ user: User }> => {
    return api
      .patch("api/users/profile/experience-level", {
        json: { experienceLevel },
      })
      .json<{ user: User }>();
  },
};

export const feedbackApi = {
  submitFeedback: async (data: {
    recommendationId: string;
    usefulnessRating: number;
    wouldFollow: boolean;
    comment?: string;
  }): Promise<{
    id: string;
    userId: string;
    recommendationId: string;
    usefulnessRating: number;
    wouldFollow: boolean;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    message?: string;
  }> => {
    return api.post("api/feedback", { json: data }).json();
  },

  checkFeedbackStatus: async (
    recommendationId: string
  ): Promise<{ hasSubmitted: boolean }> => {
    return api
      .get(`api/feedback/status/${recommendationId}`)
      .json<{ hasSubmitted: boolean }>();
  },
};

/**
 * Training status types
 */
type TrainingStatusType = "on_track" | "slightly_off_track" | "off_track";
type IneligibilityReason = "no_active_plan" | "week_one" | "no_recent_activities";

interface TrainingStatusSuccess {
  status: TrainingStatusType;
  rationale: string;
  currentWeek: number;
}

interface TrainingStatusIneligible {
  eligibleForStatus: false;
  reason: IneligibilityReason;
}

export type TrainingStatusResponse = TrainingStatusSuccess | TrainingStatusIneligible;

export const trainingStatusApi = {
  getStatus: async (): Promise<TrainingStatusResponse> => {
    return api.post("api/training-status").json<TrainingStatusResponse>();
  },
};
