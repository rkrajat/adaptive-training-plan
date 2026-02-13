"use client";

import { useEffect } from "react";

import { initTelemetry } from "./init";

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
  }, []);

  return <>{children}</>;
};
