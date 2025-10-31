import ky from "ky";
import type { Activity, User } from "@adaptive-training-plan/types";

import { getToken, removeToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Create ky instance with JWT interceptor
export const api = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
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

export const recommendationsApi = {
  generate: async (regenerate = false): Promise<Response> => {
    const token = getToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    // Use native fetch for streaming support (ky doesn't support streaming well)
    const response = await fetch(`${API_URL}/api/recommendations/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ regenerate }),
    });

    if (response.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    return response;
  },
};
