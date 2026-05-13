"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { saveCookieConsent } from "@/app/actions/cookie-consent";
import { buildConsent, consentLevel } from "@/lib/consent";
import { denyAnalytics, initAnalytics } from "@/lib/analytics/posthog";
import { CookiePreferences, shouldShowConsentBanner } from "@/components/legal/CookiePreferences";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => shouldShowConsentBanner());
  const [customise, setCustomise] = useState(false);
  const [isPending, start] = useTransition();

  function choose(kind: "all" | "reject") {
    const consent =
      kind === "all"
        ? buildConsent({ functional: true, analytics: true, marketing: true })
        : buildConsent({ functional: false, analytics: false, marketing: false });

    window.localStorage.setItem("atlas-cookie-consent", JSON.stringify(consent));
    if (consent.analytics) {
      initAnalytics(consentLevel(consent));
    } else {
      denyAnalytics();
    }
    setVisible(false);
    start(async () => {
      try {
        await saveCookieConsent(consent);
      } catch (error) {
        console.error("Failed to persist cookie consent", error);
      }
    });
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <section className="fixed bottom-4 left-1/2 z-[1000] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-[--border-strong] bg-[--bg-app] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[--text-primary]">Cookie preferences</h2>
            <p className="mt-2 text-sm leading-6 text-[--text-secondary]">
              We use cookies to make Atlas HR work, remember your preferences, and understand how the site is used.
              You can choose what to allow. Read the <Link href="/cookies" className="font-medium text-[--accent] hover:underline">Cookie Policy</Link>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => choose("reject")}
            className="rounded-md p-1 text-[--text-tertiary] transition hover:bg-[--bg-hover] hover:text-[--text-primary]"
            aria-label="Reject all and close"
          >
            <X size={18} />
          </button>
        </div>

        {customise ? (
          <div className="mt-4">
            <CookiePreferences onSaved={() => setVisible(false)} />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <button
              type="button"
              onClick={() => choose("all")}
              disabled={isPending}
              className="min-h-11 rounded-lg bg-[--accent] px-4 py-2 text-sm font-semibold text-[--primary-foreground] transition hover:bg-[--accent-hover] disabled:opacity-60"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => choose("reject")}
              disabled={isPending}
              className="min-h-11 rounded-lg border border-[--accent] px-4 py-2 text-sm font-semibold text-[--accent] transition hover:bg-[--accent-soft] disabled:opacity-60"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={() => setCustomise(true)}
              className="col-span-2 min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-[--text-primary] transition hover:bg-[--bg-hover] sm:col-span-1"
            >
              Customise
            </button>
          </div>
        )}
      </section>
    </>
  );
}
