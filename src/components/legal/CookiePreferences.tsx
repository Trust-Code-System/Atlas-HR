"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { saveCookieConsent } from "@/app/actions/cookie-consent";
import {
  buildConsent,
  consentLevel,
  CONSENT_STORAGE_KEY,
  isConsentExpired,
  type CookieConsent,
} from "@/lib/consent";
import { denyAnalytics, initAnalytics } from "@/lib/analytics/posthog";

type ToggleKey = "functional" | "analytics" | "marketing";

const sections: Array<{
  key: ToggleKey | "necessary";
  title: string;
  description: string;
}> = [
  {
    key: "necessary",
    title: "Strictly necessary",
    description: "Required for sign-in, security, routing, billing redirects, and the core service.",
  },
  {
    key: "functional",
    title: "Functional",
    description: "Remembers preferences such as theme, accent colour, sidebar state, and consent choices.",
  },
  {
    key: "analytics",
    title: "Analytics",
    description: "Helps us understand usage and product reliability through PostHog. Off until allowed.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description: "Reserved for future campaign attribution. Atlas HR does not currently use marketing cookies.",
  },
];

export function readStoredConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  if (consent.analytics) {
    initAnalytics(consentLevel(consent));
  } else {
    denyAnalytics();
  }
}

export function CookiePreferences({
  initialConsent,
  embedded = false,
  onSaved,
}: {
  initialConsent?: CookieConsent | null;
  embedded?: boolean;
  onSaved?: () => void;
}) {
  const [values, setValues] = useState({
    functional: initialConsent?.functional ?? false,
    analytics: initialConsent?.analytics ?? false,
    marketing: initialConsent?.marketing ?? false,
  });
  const [saved, setSaved] = useState(false);
  const [isPending, start] = useTransition();

  function save(input = values, doNotSellOrShare = false) {
    const consent = buildConsent({ ...input, doNotSellOrShare });
    persistConsent(consent);
    setSaved(false);
    onSaved?.();
    start(async () => {
      try {
        await saveCookieConsent(consent);
      } catch (error) {
        console.error("Failed to persist cookie preferences", error);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-5"}>
      {sections.map((section) => {
        const disabled = section.key === "necessary";
        const on = disabled || values[section.key as ToggleKey];
        return (
          <div key={section.key} className="rounded-lg border border-[--border] bg-[--bg-card] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[--text-primary]">{section.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[--text-secondary]">{section.description}</p>
                <Link href="/cookies" className="mt-2 inline-block text-xs font-medium text-[--accent] hover:underline">
                  Cookie Policy
                </Link>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on ? "true" : "false"}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  const key = section.key as ToggleKey;
                  setValues((current) => ({ ...current, [key]: !current[key] }));
                }}
                className={`relative mt-1 inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                  on ? "bg-[--accent]" : "bg-[--border]"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <span
                  className={`mt-1 h-4 w-4 rounded-full bg-primary-foreground shadow transition ${
                    on ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save()}
          disabled={isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[--accent] px-4 py-2 text-sm font-semibold text-[--primary-foreground] transition hover:bg-[--accent-hover] disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Save preferences
        </button>
        <button
          type="button"
          onClick={() => {
            const next = { functional: false, analytics: false, marketing: false };
            setValues(next);
            save(next, true);
          }}
          disabled={isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[--border] px-4 py-2 text-sm font-semibold text-[--text-primary] transition hover:bg-[--bg-hover] disabled:opacity-60"
        >
          <X size={15} />
          Do not sell or share
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </div>
  );
}

export function shouldShowConsentBanner() {
  const consent = readStoredConsent();
  return isConsentExpired(consent);
}
