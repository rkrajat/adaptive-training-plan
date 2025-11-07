import ky from "ky";
import type {
  Activity,
  User,
  TrainingPlan,
  TrainingPlanWithContent,
} from "@adaptive-training-plan/types";

import { getToken, removeToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Create ky instance with JWT interceptor and timeout configuration
export const api = ky.create({
  prefixUrl: API_URL,
  timeout: 120000, // 2 minutes - matches backend timeout for AI recommendations
  retry: {
    limit: 0, // Disable retries for long-running AI requests
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();

        if (!token) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
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
};

export const trainingPlansApi = {
  list: async (): Promise<{ plans: TrainingPlan[] }> => {
    return api.get("api/training-plans").json<{ plans: TrainingPlan[] }>();
  },

  upload: async (
    file: File,
    metadata: {
      name: string;
      goal?: string;
      raceName?: string;
      raceDate?: string;
      raceDistance?: string;
      targetTime?: string;
    }
  ): Promise<TrainingPlanWithContent> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", metadata.name);
    if (metadata.goal) formData.append("goal", metadata.goal);
    if (metadata.raceName) formData.append("raceName", metadata.raceName);
    if (metadata.raceDate) formData.append("raceDate", metadata.raceDate);
    if (metadata.raceDistance)
      formData.append("raceDistance", metadata.raceDistance);
    if (metadata.targetTime) formData.append("targetTime", metadata.targetTime);

    return api
      .post("api/training-plans", { body: formData })
      .json<TrainingPlanWithContent>();
  },

  getById: async (id: string): Promise<TrainingPlanWithContent> => {
    return api.get(`api/training-plans/${id}`).json<TrainingPlanWithContent>();
  },
};

export const recommendationsApi = {
  generate: async (regenerate = false): Promise<Response> => {
    // Use native fetch for streaming support (ky doesn't support streaming well)
    const response = await fetch(`${API_URL}/api/recommendations/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ regenerate }),
    });

    return response;
  },

  generateWithPlan: async (planId: string, userFeedback?: string) => {
    const response = await fetch(
      `${API_URL}/api/recommendations/generate-with-plan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ planId, userFeedback }),
      }
    );

    return response;
  },
};
