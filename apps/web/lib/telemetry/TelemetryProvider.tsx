"use client";

import { useEffect } from "react";

import { getToken } from "@/lib/auth";

import { initTelemetry } from "./init";
import { setTelemetryUser } from "./user-context";

/**
 * Client component that initializes OpenTelemetry on mount.
 * Should be included once in the app's provider hierarchy.
 */
export const TelemetryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    initTelemetry();

    // Initialize user context from existing token
    const token = getToken();
    if (token) {
      setTelemetryUser(token);
    }
  }, []);

  return <>{children}</>;
};
