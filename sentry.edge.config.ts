import * as Sentry from "@sentry/nextjs";
import { scrubPII } from "@/lib/observability/scrub-pii";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
  tracesSampleRate:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

  beforeSend(event) {
    return scrubPII(event) as Sentry.ErrorEvent;
  },

  ignoreErrors: ["Network request failed", "Load failed", "cancelled", "AbortError"],
});
