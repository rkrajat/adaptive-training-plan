"use client";

import { trace, SpanStatusCode } from "@opentelemetry/api";

import { isTelemetryEnabled } from "./init";
import { getTelemetryUserAttributes } from "./user-context";

type AttributeValue = string | number | boolean;

/**
 * Track a user action or event.
 * Creates a span with the given name and attributes.
 *
 * @example
 * ```typescript
 * trackEvent('recommendation.view', {
 *   'recommendation.id': recommendationId,
 *   'week_number': weekNumber,
 * });
 * ```
 */
export const trackEvent = (
  eventName: string,
  attributes?: Record<string, AttributeValue>
): void => {
  // Skip if telemetry is not initialized
  if (!isTelemetryEnabled()) {
    return;
  }

  try {
    const tracer = trace.getTracer("user-actions");
    const span = tracer.startSpan(eventName);

    const userAttrs = getTelemetryUserAttributes();
    if (userAttrs) {
      span.setAttributes(userAttrs);
    }

    if (attributes) {
      span.setAttributes(attributes);
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  } catch (error) {
    // Silently fail - telemetry should never break the app
    console.warn("Failed to track event:", eventName, error);
  }
};

/**
 * Track an async operation with timing.
 * Creates a span that wraps the operation and records duration.
 *
 * @example
 * ```typescript
 * const result = await trackAsyncEvent('api.fetch_recommendations', async () => {
 *   return await fetchRecommendations();
 * }, {
 *   'user.id': userId,
 * });
 * ```
 */
export const trackAsyncEvent = async <T>(
  eventName: string,
  operation: () => Promise<T>,
  attributes?: Record<string, AttributeValue>
): Promise<T> => {
  // If telemetry is not enabled, just run the operation
  if (!isTelemetryEnabled()) {
    return operation();
  }

  const tracer = trace.getTracer("user-actions");
  const span = tracer.startSpan(eventName);

  const userAttrs = getTelemetryUserAttributes();
  if (userAttrs) {
    span.setAttributes(userAttrs);
  }

  if (attributes) {
    span.setAttributes(attributes);
  }

  try {
    const result = await operation();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    span.recordException(
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  } finally {
    span.end();
  }
};
