import * as Sentry from "@sentry/nextjs";
import { scrubPII } from "@/lib/observability/scrub-pii";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",

  tracesSampleRate:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
      networkDetailAllowUrls: [],
    }),
    Sentry.browserTracingIntegration(),
  ],

  beforeSend(event) {
    return scrubPII(event) as Sentry.ErrorEvent;
  },

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Network request failed",
    "Load failed",
    "cancelled",
    "AbortError",
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
  ],

  denyUrls: [/chrome-extension:\/\//, /moz-extension:\/\//],
});
