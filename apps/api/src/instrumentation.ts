/**
 * OpenTelemetry Instrumentation Configuration
 *
 * IMPORTANT: This file must be imported at the very top of index.ts,
 * before any other imports, to ensure proper instrumentation of all modules.
 */

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

const isEnabled = Boolean(process.env.OTEL_EXPORTER_OTLP_HEADERS);

if (isEnabled) {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Enable HTTP instrumentation for Express routes
        "@opentelemetry/instrumentation-http": {
          enabled: true,
        },
        // Enable MongoDB instrumentation
        "@opentelemetry/instrumentation-mongodb": {
          enabled: true,
        },
        // Enable fetch instrumentation for external API calls (Strava, OpenAI)
        "@opentelemetry/instrumentation-undici": {
          enabled: true,
        },
        // Disable instrumentations we don't need
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
        "@opentelemetry/instrumentation-dns": {
          enabled: false,
        },
        "@opentelemetry/instrumentation-net": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  const shutdown = () => {
    sdk
      .shutdown()
      .then(() => console.log("OpenTelemetry SDK shut down successfully"))
      .catch((error: unknown) =>
        console.error("Error shutting down OpenTelemetry SDK:", error)
      );
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log(
    `OpenTelemetry instrumentation initialized for service: ${process.env.OTEL_SERVICE_NAME || "adaptive-training-api"}`
  );
} else {
  console.log(
    "OpenTelemetry instrumentation disabled (HONEYCOMB_API_KEY not set)"
  );
}

export { isEnabled as telemetryEnabled };
