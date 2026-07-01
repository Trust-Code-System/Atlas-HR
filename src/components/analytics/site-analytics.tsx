"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CONSENT_STORAGE_KEY,
  buildConsent,
  consentLevel,
  isConsentExpired,
  type CookieConsent,
} from "@/lib/consent";
import {
  grantAnalytics,
  denyAnalytics,
  capturePageview,
} from "@/lib/analytics/posthog";
import { saveCookieConsent } from "@/app/actions/cookie-consent";

// Reads a previously stored consent decision from localStorage (client only).
function readInitialConsent(): CookieConsent | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as CookieConsent;
    return isConsentExpired(stored) ? null : stored;
  } catch {
    return null;
  }
}

/**
 * Mounts privacy-safe analytics + the cookie-consent banner.
 *
 * - Analytics (PostHog) never initialise until the visitor grants analytics
 *   consent (the underlying `initAnalytics` also hard-gates on consent level).
 * - The banner shows only until a valid, unexpired decision exists.
 * - Pageviews are captured manually on route change once consent is granted.
 */
export function SiteAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<CookieConsent | null | undefined>();

  useEffect(() => {
    window.setTimeout(() => {
      setConsent(readInitialConsent() ?? null);
    }, 0);
  }, []);

  useEffect(() => {
    if (consent && consentLevel(consent) === "analytics") {
      grantAnalytics(window.location.href);
    }
  }, [consent]);

  // Capture a pageview on every route change once analytics is granted.
  useEffect(() => {
    if (consent && consentLevel(consent) === "analytics") {
      capturePageview(window.location.href);
    }
  }, [pathname, consent]);

  const decide = useCallback((analytics: boolean) => {
    const next = buildConsent({
      functional: true,
      analytics,
      marketing: analytics,
    });
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable — the server cookie still records it */
    }
    setConsent(next);
    if (!analytics) {
      denyAnalytics();
    }
    // Persist server-side (signed cookie + profile row when signed in).
    void saveCookieConsent(next);
  }, []);

  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] px-4 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-navy-950/95 p-5 text-white shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-navy-200">
          We use essential cookies to run Atlas HR and, with your consent,
          analytics cookies to understand how the site is used. See our{" "}
          <Link href="/legal/cookies" className="font-semibold text-blue-300 hover:text-blue-200 underline">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-blue-300 hover:text-blue-200 underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide(false)}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
