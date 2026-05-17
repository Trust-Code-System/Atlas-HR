"use client";

import posthog from "posthog-js";
import type { consentLevel } from "@/lib/consent";

type ConsentLevel = ReturnType<typeof consentLevel>;

let initialized = false;

export function initAnalytics(consentLevel: ConsentLevel) {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (consentLevel === "none" || consentLevel === "functional") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    capture_pageview: false,   // captured manually in AnalyticsBoot for accuracy
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false,        // explicit events only — implicit is noise
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-private]",
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });

  initialized = true;
}

export function grantAnalytics() {
  if (!initialized) {
    initAnalytics("analytics");
    posthog.opt_in_capturing();
  } else {
    posthog.opt_in_capturing();
  }
}

export function denyAnalytics() {
  if (!initialized) return;
  posthog.opt_out_capturing();
  initialized = false;
  // Clear PostHog cookies so consent is fully respected
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name?.startsWith("ph_") || name?.includes("posthog")) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    });
  }
}

export function capturePageview(url?: string) {
  if (!initialized) return;
  posthog.capture("$pageview", url ? { $current_url: url } : undefined);
}

export function isAnalyticsReady() {
  return initialized;
}

export function identifyUser(
  userId: string,
  properties: {
    role?: string | null;
    plan?: string | null;
    country?: string | null;
    industry?: string | null;
    company_size?: string | null;
    signup_date?: string | null;
  }
) {
  if (!initialized) return;
  posthog.identify(userId, {
    // Only safe properties — NO email, NO full name
    role: properties.role ?? undefined,
    plan: properties.plan ?? undefined,
    country: properties.country ?? undefined,
    industry: properties.industry ?? undefined,
    company_size: properties.company_size ?? undefined,
    signup_date: properties.signup_date ?? undefined,
  });
}

export function identifyGroup(
  orgId: string,
  properties: {
    name?: string | null;
    size?: string | null;
    industry?: string | null;
  }
) {
  if (!initialized) return;
  posthog.group("organisation", orgId, {
    name: properties.name ?? undefined,
    size: properties.size ?? undefined,
    industry: properties.industry ?? undefined,
  });
}

export function resetIdentity() {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
