import { trace } from "@opentelemetry/api";

import { TRACER_NAME } from "./constants";

/**
 * Create a custom span for business operations.
 *
 * @example
 * ```typescript
 * const result = await withSpan('recommendation.generate', async (span) => {
 *   span.setAttribute('user.id', userId);
 *   span.setAttribute('week_number', weekNumber);
 *   return await generateRecommendation(userId, weekNumber);
 * });
 * ```
 */
export const withSpan = async <T>(
  spanName: string,
  operation: (
    span: ReturnType<ReturnType<typeof trace.getTracer>["startSpan"]>
  ) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> => {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan(spanName);

  if (attributes) {
    span.setAttributes(attributes);
  }

  try {
    const result = await operation(span);
    span.setStatus({ code: 1 }); // OK status
    return result;
  } catch (error) {
    span.setStatus({
      code: 2, // ERROR status
      message: error instanceof Error ? error.message : "Unknown error",
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
};

/**
 * Record a simple event span (fire-and-forget style).
 * Useful for tracking discrete events without wrapping async operations.
 *
 * @example
 * ```typescript
 * recordEvent('recommendation.accept', {
 *   'user.id': userId,
 *   'recommendation.id': recommendationId,
 * });
 * ```
 */
export const recordEvent = (
  eventName: string,
  attributes?: Record<string, string | number | boolean>
): void => {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan(eventName);

  if (attributes) {
    span.setAttributes(attributes);
  }

  span.end();
};
