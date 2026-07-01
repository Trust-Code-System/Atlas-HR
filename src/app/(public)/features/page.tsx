import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Features | Atlas HR",
  description:
    "Everything Atlas HR does — global hiring, AI compliance, visual automations, documents and e-signatures, people operations, and predictive analytics in one platform.",
};

const featureGroups = [
  {
    eyebrow: "Global hiring",
    title: "Hire anywhere without guessing the rules.",
    body: "Country-specific hiring journeys for Lagos, Bengaluru, London, and US teams — with the contracts, taxes, and onboarding steps that actually apply in each market.",
    points: [
      "Country-aware hiring cockpit for Nigeria, India, the UK, and the US",
      "Cost and risk calculator for global offers before you commit",
      "Guided workflow paths from offer to first day",
    ],
  },
  {
    eyebrow: "Compliance & AI",
    title: "Atlas AI drafts, reviews, and flags — you decide.",
    body: "The AI Compliance Sandbox helps you research employment rules and draft documents, with human-review checkpoints and legal-escalation warnings on high-risk answers.",
    points: [
      "AI Compliance Sandbox for research and drafting",
      "Legal-review warnings on high-risk decisions",
      "Compliance updates surfaced by country",
    ],
  },
  {
    eyebrow: "Automations",
    title: "If-this-then-that flows across your whole stack.",
    body: "Build visual automations that span IT, payroll, documents, and compliance. When an employee is terminated in the UK, revoke access, generate the P45 checklist, and archive the audit trail automatically.",
    points: [
      "Visual automation builder with triggers and actions",
      "Cross-system steps: IT access, payroll, documents",
      "Complete audit trail on every workflow run",
    ],
  },
  {
    eyebrow: "Documents & people ops",
    title: "One record for every employee moment.",
    body: "Country-aware contracts sent for signature, org charts, self-service tasks, shoutouts, and profile tags — the day-to-day people operations that keep teams running.",
    points: [
      "Documents and e-signatures with version control",
      "Org charts, profiles, and employee self-service",
      "Predictive analytics with turnover warnings",
    ],
  },
];

const platform = [
  {
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
    title: "Global hiring cockpit",
    body: "Country-specific hiring journeys for Lagos, Bengaluru, London, and US teams.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Visual automation builder",
    body: "If-this-then-that flows across IT, payroll, documents, and compliance.",
  },
  {
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    title: "Resource center engine",
    body: "Templates, calculators, and country guides turned into search-ready resources.",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Employee experience",
    body: "Shoutouts, profile tags, org charts, and self-service tasks for everyone.",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Predictive analytics",
    body: "Move from charts to action with turnover warnings and manager follow-up.",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Documents + signatures",
    body: "Country-aware contracts sent for signature without losing version control.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Atlas HR Features
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              The all-in-one HR platform for modern, growing teams.
            </h1>
            <p className="mt-6 text-base leading-8 text-navy-200 sm:text-lg">
              Hiring, compliance, payroll, documents, automations, and people
              operations — with Atlas AI helping at every step and humans always
              in control of the decisions that matter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl space-y-16">
          {featureGroups.map((group, index) => (
            <div
              key={group.title}
              className={`grid gap-8 lg:grid-cols-2 lg:items-center ${
                index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  {group.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
                  {group.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {group.body}
                </p>
              </div>
              <ul className="grid gap-3">
                {group.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-navy-800 shadow-sm"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Everything in one place
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
              Six pillars, one connected platform.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {platform.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-navy-950 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to run HR in one place?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-navy-300">
            Start a free workspace and see how Atlas HR handles hiring,
            compliance, and automations for your team.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
