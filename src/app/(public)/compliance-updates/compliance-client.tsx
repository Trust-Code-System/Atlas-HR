"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveComplianceSubscriptions } from "./actions";
import {
  type ComplianceUpdate,
  SEVERITY_STYLES,
  SEVERITY_LABELS,
} from "@/lib/compliance-shared";

const COUNTRIES = ["All", "Nigeria", "India", "United Kingdom", "United States"];

const COUNTRY_FLAG: Record<string, string> = {
  Nigeria: "🇳🇬",
  India: "🇮🇳",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
};

const COUNTRY_HUB_SLUG: Record<string, string> = {
  Nigeria: "nigeria",
  India: "india",
  "United Kingdom": "uk",
  "United States": "us",
};

interface Props {
  updates: ComplianceUpdate[];
  isLoggedIn: boolean;
  initialSubscriptions: string[];
}

export function ComplianceClient({ updates, isLoggedIn, initialSubscriptions }: Props) {
  const [activeCountry, setActiveCountry] = useState("All");
  const [search, setSearch] = useState("");
  const [subscriptions, setSubscriptions] = useState<string[]>(initialSubscriptions);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const filtered = updates.filter((u) => {
    const matchesCountry = activeCountry === "All" || u.country === activeCountry;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.title.toLowerCase().includes(q) ||
      u.whatChanged.toLowerCase().includes(q) ||
      u.whoIsAffected.toLowerCase().includes(q);
    return matchesCountry && matchesSearch;
  });

  const subscribedUpdates = filtered.filter((u) => subscriptions.includes(u.country));
  const otherUpdates = filtered.filter((u) => !subscriptions.includes(u.country));

  function toggleSubscription(country: string) {
    setSubscriptions((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  }

  function saveSubscriptions() {
    setSaveState("saving");
    startTransition(async () => {
      const result = await saveComplianceSubscriptions(subscriptions);
      setSaveState(result.success ? "saved" : "error");
      setTimeout(() => setSaveState("idle"), 3000);
    });
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">

        {/* ── Main content ── */}
        <div className="space-y-6">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCountry(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeCountry === c
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {c !== "All" && <span className="mr-1">{COUNTRY_FLAG[c]}</span>}
                  {c}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search updates…"
                className="pl-8 pr-3 h-9 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
              />
            </div>
          </div>

          {/* Subscribed country updates (highlighted) */}
          {subscriptions.length > 0 && subscribedUpdates.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Your subscribed jurisdictions
              </p>
              {subscribedUpdates.map((u) => (
                <UpdateCard key={u.id} update={u} isSubscribed />
              ))}
            </div>
          )}

          {/* All other updates */}
          {otherUpdates.length > 0 && (
            <div className="space-y-4">
              {subscriptions.length > 0 && subscribedUpdates.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Other jurisdictions
                </p>
              )}
              {otherUpdates.map((u) => (
                <UpdateCard key={u.id} update={u} isSubscribed={false} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">No compliance updates match your filters.</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="mt-8 space-y-5 lg:mt-0">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Subscription widget */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h2 className="text-sm font-bold text-navy-900">Jurisdiction alerts</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {isLoggedIn
                  ? "Select jurisdictions and save to get notified of new compliance updates."
                  : "Sign in to save jurisdiction subscriptions and receive alerts."}
              </p>
              <div className="space-y-2 mb-4">
                {["Nigeria", "India", "United Kingdom", "United States"].map((country) => (
                  <label
                    key={country}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={subscriptions.includes(country)}
                      onChange={() => toggleSubscription(country)}
                      disabled={!isLoggedIn}
                      className="h-4 w-4 rounded accent-blue-600 disabled:opacity-40"
                    />
                    <span className="text-sm text-navy-700 group-hover:text-navy-900 flex items-center gap-1.5">
                      <span>{COUNTRY_FLAG[country]}</span>
                      {country}
                    </span>
                    {subscriptions.includes(country) && (
                      <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={saveSubscriptions}
                  disabled={isPending || saveState === "saving"}
                  className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : saveState === "error" ? "Error — retry" : "Save subscriptions"}
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="block w-full rounded-xl border border-blue-200 py-2 text-sm font-semibold text-blue-600 text-center hover:bg-blue-50 transition-colors"
                >
                  Sign in to subscribe
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">This month</h2>
              <div className="space-y-3">
                {(["action_needed", "review_recommended", "monitoring"] as const).map((sev) => {
                  const count = updates.filter((u) => u.severity === sev).length;
                  return (
                    <div key={sev} className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[sev]}`}>
                        {SEVERITY_LABELS[sev]}
                      </span>
                      <span className="text-sm font-bold text-navy-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country hubs */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Country HR hubs</h2>
              <div className="space-y-2">
                {["Nigeria", "India", "United Kingdom", "United States"].map((c) => (
                  <Link
                    key={c}
                    href={`/countries/${COUNTRY_HUB_SLUG[c]}`}
                    className="flex items-center gap-2 text-sm text-navy-700 hover:text-blue-600 transition-colors"
                  >
                    <span>{COUNTRY_FLAG[c]}</span>
                    {c} HR guide →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─── Update card ───────────────────────────────────────────────────────────────

function UpdateCard({
  update: u,
  isSubscribed,
}: {
  update: ComplianceUpdate;
  isSubscribed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm ${
        isSubscribed ? "border-blue-200" : "border-slate-200"
      }`}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-base">{COUNTRY_FLAG[u.country] ?? ""}</span>
          <span className="text-xs font-semibold text-slate-600">{u.country}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[u.severity]}`}>
            {SEVERITY_LABELS[u.severity]}
          </span>
          {isSubscribed && (
            <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
              Subscribed
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-mono ml-auto">{u.date}</span>
        </div>

        <h2 className="font-bold text-navy-900 text-base leading-snug">{u.title}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">What changed</p>
            <p className="text-sm text-slate-600 leading-relaxed">{u.whatChanged}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Who is affected</p>
            <p className="text-sm text-slate-600 leading-relaxed">{u.whoIsAffected}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {expanded ? "Hide actions" : "Show what to do next"}
          <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">What to do next</p>
          <ul className="space-y-2 mb-4">
            {u.whatToDoNext.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          {(u.linkedTemplates?.length > 0 || u.linkedArticles?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {u.linkedTemplates?.map((slug) => (
                <Link
                  key={slug}
                  href={`/templates#${slug}`}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  📄 Template
                </Link>
              ))}
              {u.linkedArticles?.map((slug) => (
                <Link
                  key={slug}
                  href={`/knowledge/${slug}`}
                  className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  📖 Article
                </Link>
              ))}
              <Link
                href={`/countries/${u.countrySlug}`}
                className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                🌍 Country guide
              </Link>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
