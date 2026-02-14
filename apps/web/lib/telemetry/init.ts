"use client";

import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchSpanProcessor,
  WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

let initialized = false;

/**
 * Initialize OpenTelemetry for browser-side instrumentation.
 * Should be called once on app load.
 */
export const initTelemetry = (): void => {
  // Only initialize once and only in browser
  if (initialized || typeof window === "undefined") {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_HONEYCOMB_API_KEY;
  const serviceName =
    process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME || "adaptive-training-web";

  // Skip initialization if no API key is configured
  if (!apiKey) {
    console.log("OpenTelemetry disabled (NEXT_PUBLIC_HONEYCOMB_API_KEY not set)");
    return;
  }

  try {
    // Create resource with service name
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    });

    // Configure OTLP exporter for Honeycomb
    const exporter = new OTLPTraceExporter({
      url: "https://api.eu1.honeycomb.io/v1/traces",
      headers: {
        "x-honeycomb-team": apiKey,
      },
    });

    // Create tracer provider with batch processing
    const provider = new WebTracerProvider({
      resource,
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });

    // Use Zone context manager for async context propagation
    provider.register({
      contextManager: new ZoneContextManager(),
    });

    // Register fetch instrumentation for auto-tracing API calls
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          // Only trace calls to our API
          ignoreUrls: [
            /^https?:\/\/(?!.*localhost|.*api\.).*$/,
            /google-analytics/,
            /honeycomb\.io/,
          ],
          propagateTraceHeaderCorsUrls: [
            // Propagate trace context to our API
            /localhost:4000/,
            /api\./,
          ],
        }),
      ],
    });

    initialized = true;
    console.log(`OpenTelemetry initialized for service: ${serviceName}`);
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
  }
};

/**
 * Check if telemetry has been initialized
 */
export const isTelemetryEnabled = (): boolean => initialized;
