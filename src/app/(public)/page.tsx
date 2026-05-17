import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AtlasAiMark } from "@/components/atlas-ai-mark";
import { GlobalHiringCalculator } from "./global-hiring-calculator";
import { CorridorSlideshow } from "@/components/landing/corridor-slideshow";

export const metadata: Metadata = {
  title: "Global HR, Compliance, Payroll, and People Operations Software",
  description:
    "Atlas HR helps global teams hire, onboard, pay, manage, and protect employees across Nigeria, India, the UK, and the US with AI-powered compliance workflows.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "4", label: "Country hubs" },
  { value: "10+", label: "AI workflows" },
  { value: "40+", label: "Templates & tools" },
  { value: "2026", label: "HR resource engine" },
];

const aiAnswerLines = [
  "Probation is usually contract and state-rule driven in India.",
  "Atlas checks the state, role type, notice language, PF/ESI exposure, and confirmation workflow.",
  "Next action: generate the India offer pack and onboarding checklist.",
];

const automationSteps = [
  { title: "Employee terminated in the UK", type: "Trigger", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Revoke Slack and payroll access", type: "Automated", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { title: "Generate P45 and final-pay checklist", type: "Automated", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { title: "Archive documents and audit trail", type: "Automated", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
];

const features = [
  {
    title: "AI Compliance Sandbox",
    body: "Ask any HR question, see Atlas reason through the risk, then continue into the product with a ready-made workflow.",
    href: "/sign-up?intent=compliance-sandbox",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    from: "from-blue-600", to: "to-blue-800",
  },
  {
    title: "Cost & Risk Calculator",
    body: "Country hubs become interactive calculators for employer load, benefits, documents, and compliance checkpoints.",
    href: "#global-hiring-calculator",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    from: "from-blue-500", to: "to-cyan-500",
  },
  {
    title: "Guided Workflow Paths",
    body: "Distinct founder, HR manager, and compliance officer journeys connect the public story to product workflows.",
    href: "/workflows",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    from: "from-emerald-500", to: "to-teal-500",
  },
];

const corridorCards = [
  { code: "UK·NG", title: "London to Lagos", body: "For UK companies managing Nigerian engineering, operations, and support teams.", href: "/countries/nigeria", from: "from-amber-500", to: "to-orange-600" },
  { code: "US·IN", title: "US to India", body: "For US teams hiring distributed product, finance, and technical talent across Indian states.", href: "/countries/india", from: "from-blue-500", to: "to-blue-700" },
  { code: "US", title: "Remote US teams", body: "For multi-state employers who need final-pay, leave, handbook, and payroll controls.", href: "/countries/us", from: "from-sky-400", to: "to-blue-500" },
];

const platformMoves = [
  { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", title: "Global hiring cockpit", body: "Country-specific hiring journeys for Lagos, Bengaluru, London, and US teams.", from: "from-blue-500", to: "to-cyan-500" },
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Visual automation builder", body: "If-this-then-that flows across IT, payroll, documents, and compliance.", from: "from-amber-500", to: "to-orange-500" },
  { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", title: "Resource center engine", body: "Templates, calculators, and country guides into search-ready public resources.", from: "from-emerald-500", to: "to-teal-500" },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", title: "Employee experience", body: "Shoutouts, profile tags, org charts, and self-service tasks for every employee.", from: "from-pink-500", to: "to-rose-500" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Predictive analytics", body: "Move from charts to action with turnover warnings and manager follow-up.", from: "from-blue-600", to: "to-blue-800" },
  { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Documents + signatures", body: "Country-aware contracts sent for signature without losing version control.", from: "from-slate-600", to: "to-slate-800" },
];

const resourceCards = [
  { label: "Guide", labelColor: "bg-amber-100 text-amber-700", title: "The 2026 Nigerian HR Compliance Pack", body: "Employment contracts, PAYE, pension, leave, termination, and final settlement workflow guidance.", href: "/countries/nigeria" },
  { label: "Template", labelColor: "bg-blue-100 text-blue-700", title: "Country-Specific Employment Contract", body: "Generate US, UK, Nigeria, and India variants, then save the signed version to the employee file.", href: "/workflows/country-specific-employment-contract" },
  { label: "Tool", labelColor: "bg-emerald-100 text-emerald-700", title: "Performance Management in Nigeria", body: "A programmatic SEO path from public education into reviews, PIPs, 1:1s, and manager workflows.", href: "/tools" },
];

// ─── Decorative blobs ─────────────────────────────────────────────────────────

function HeroBlobs() {
  return (
    <>
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)]" />
      <div className="absolute -top-20 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.12),transparent_70%)]" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.07),transparent_70%)]" />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-white text-navy-900 overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden py-20 lg:py-28">
        {/* Background layers */}
        <div className="absolute inset-0 -z-10">
          <HeroBlobs />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-linear-to-t from-white to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-8">
          {/* Left — copy */}
          <div className="max-w-2xl">
            <h1 className="mt-7 text-[52px] font-extrabold leading-[1.08] tracking-tight text-navy-950 text-shadow-hero sm:text-[64px] lg:text-[72px]">
              HR for teams
              <br />
              that{" "}
              <span className="relative inline-block drop-shadow-hero-blue">
                <span className="bg-linear-to-r from-navy-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
                  cross borders.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none" preserveAspectRatio="none">
                  <path d="M0 7 C75 1, 225 1, 300 7" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="50%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mt-7 text-lg leading-relaxed text-slate-600">
              Hire in Nigeria, India, the UK, and the US with country-aware
              documents, compliance alerts, payroll workflows, and Atlas AI that
              turns HR questions into completed work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
              >
                Start free — no card needed
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#global-hiring-calculator"
                className="inline-flex items-center gap-2 rounded-2xl border border-navy-200 bg-white px-7 py-3.5 text-sm font-bold text-navy-800 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Try the hiring calculator
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="text-3xl font-extrabold tracking-tight text-navy-950">{stat.value}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — AI demo card */}
          <div className="relative">
            {/* Glow layer */}
            <div className="absolute -inset-6 rounded-[40px] bg-linear-to-br from-blue-400/20 via-blue-500/15 to-blue-600/10 blur-3xl" />
            {/* Floating top-right accent */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-3xl bg-linear-to-br from-blue-400 to-blue-600 opacity-20 rotate-12 blur-sm" />

            <div className="relative rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="relative h-11 w-11 rounded-2xl bg-linear-to-br from-blue-500 via-blue-600 to-navy-800 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <div className="absolute inset-0 rounded-2xl bg-white/10" />
                  <AtlasAiMark className="h-[22px] w-[22px] text-white relative z-10" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-900">AI Compliance Sandbox</p>
                  <p className="text-xs text-slate-400">Public product-led preview</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-600">Live</span>
                </div>
              </div>

              {/* Question bubble */}
              <div className="rounded-2xl bg-linear-to-br from-slate-50 to-blue-50/50 border border-blue-100/60 p-4 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Visitor asks</p>
                <p className="text-sm font-medium text-navy-800">What is the standard probation period in India?</p>
              </div>

              {/* AI responses */}
              <div className="space-y-2.5 mb-5">
                {aiAnswerLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-sm leading-relaxed text-slate-700"
                  >
                    <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </span>
                    {line}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/sign-up?intent=generate-india-contract"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-950 px-4 py-3.5 text-sm font-bold text-white hover:bg-navy-800 transition-colors"
              >
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate the contract in Atlas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═════════════════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Country coverage</p>
          {[
            { code: "NG", label: "Nigeria" },
            { code: "IN", label: "India" },
            { code: "GB", label: "United Kingdom" },
            { code: "US", label: "United States" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-navy-100 text-[10px] font-bold tracking-wide text-navy-500">{c.code}</span>
              {c.label}
            </div>
          ))}
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            SOC2 ready · GDPR controls
          </div>
        </div>
      </section>

      {/* ══ PRODUCT-LED FEATURES ══════════════════════════════════════════════ */}
      <section id="plg-tools" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">Product-led growth</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
              Feel the value{" "}
              <span className="bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                before the demo.
              </span>
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Atlas exposes its strongest capabilities on public pages — compliance answers, hiring estimates, templates, and guided workflows that lead naturally into account creation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Gradient top bar */}
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[24px] bg-linear-to-r ${f.from} ${f.to}`} />
                {/* Icon */}
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${f.from} ${f.to} shadow-lg`}>
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-navy-950 mb-2 group-hover:text-blue-700 transition-colors">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.body}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
                  Explore
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CALCULATOR ════════════════════════════════════════════════════════ */}
      <section id="global-hiring-calculator" className="relative overflow-hidden bg-navy-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {/* Background overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-3">Interactive cost & risk calculator</p>
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Model a hire in any country.{" "}
                <span className="text-blue-300">See the real cost.</span>
              </h2>
              <p className="mt-5 text-base leading-7 text-navy-300">
                A founder can model a hire, see employer cost and compliance risks, then continue into contracts, payroll, onboarding, and document workflows.
              </p>
            </div>
            <Link
              href="/countries"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors backdrop-blur"
            >
              Browse all country hubs
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <GlobalHiringCalculator />
        </div>
      </section>

      {/* ══ AUTOMATION ════════════════════════════════════════════════════════ */}
      <section id="automation" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">Workflow automation</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl leading-tight">
              See exactly what happens{" "}
              <span className="bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                when.
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Atlas connects people data to compliance tasks, IT access, payroll outputs, documents, and audit trails — all in a single automated flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workflows/termination" className="inline-flex items-center gap-2 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition-colors">
                View termination workflow
              </Link>
              <Link href="/integrations" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-navy-800 hover:border-blue-300 hover:text-blue-700 transition-colors">
                See integrations
              </Link>
            </div>
          </div>

          {/* Automation flow card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-linear-to-br from-blue-50 to-blue-100/50 -z-10" />
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Automated termination workflow</p>
              <div className="space-y-3">
                {automationSteps.map((step, index) => (
                  <div key={step.title} className="relative">
                    {index < automationSteps.length - 1 && (
                      <div className="absolute left-5 top-[52px] h-[calc(100%-8px)] w-0.5 bg-linear-to-b from-blue-200 to-transparent" />
                    )}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        index === 0
                          ? "bg-linear-to-br from-rose-500 to-orange-600 shadow-md shadow-rose-500/25"
                          : "bg-linear-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/25"
                      } text-white`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy-900 leading-snug">{step.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.type}</p>
                      </div>
                      <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${
                        index === 0
                          ? "bg-rose-50 text-rose-600"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {index === 0 ? "Trigger" : "Auto"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs font-semibold text-emerald-700">Audit trail complete · All tasks closed · Documents archived</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ GLOBAL CORRIDORS ══════════════════════════════════════════════════ */}
      <section id="global-corridors" className="relative overflow-hidden bg-navy-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {/* Background overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(30,64,175,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_0%_50%,rgba(59,130,246,0.1),transparent)]" />

        <div className="mx-auto max-w-7xl grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          {/* Slideshow */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-linear-to-br from-blue-500/20 to-blue-700/10 blur-2xl" />
            <CorridorSlideshow />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-3">Cross-border corridor niche</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Hire in any country.
              <br />
              <span className="text-blue-300">Stay compliant everywhere.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-navy-300">
              Position Atlas for US and UK companies hiring remote talent in India and Africa, where compliance, payroll, contracts, and local HR context matter from the first hire.
            </p>
            <div className="mt-8 grid gap-4">
              {corridorCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/12 hover:border-white/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 h-10 w-10 rounded-xl bg-linear-to-br ${card.from} ${card.to} flex items-center justify-center shadow-lg`}>
                      <span className="text-[10px] font-bold tracking-wide text-white">{card.code}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">{card.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-navy-300">{card.body}</p>
                    </div>
                    <svg className="h-4 w-4 text-slate-600 ml-auto shrink-0 group-hover:text-blue-400 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ RESOURCE CENTER ═══════════════════════════════════════════════════ */}
      <section id="resource-center" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">Programmatic SEO</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl leading-tight">
              Turn every country
              <br />
              into search demand.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Atlas compounds its data model into pages like &ldquo;Performance Management in Nigeria&rdquo;, &ldquo;UK to India Payroll&rdquo;, and &ldquo;Free Disciplinary Warning Template US&rdquo;.
            </p>
            <Link href="/knowledge" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Browse the knowledge base
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-5">
            {resourceCards.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${resource.labelColor}`}>
                      {resource.label}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-navy-950 group-hover:text-blue-700 transition-colors">{resource.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{resource.body}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLATFORM MOVES ════════════════════════════════════════════════════ */}
      <section id="platform" className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#f8faff_0%,#eff6ff_50%,#f0f8ff_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-3">Global platform strategy</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
              Complex HR made{" "}
              <span className="bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                beautifully simple.
              </span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              These are the Atlas-specific moves that turn compliance, employee experience, performance, payroll, and analytics into a coherent global HR suite.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformMoves.map((move) => (
              <article
                key={move.title}
                className="group rounded-[20px] border border-white bg-white/80 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 backdrop-blur"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${move.from} ${move.to} shadow-md text-white`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={move.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-navy-950 group-hover:text-blue-700 transition-colors">{move.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{move.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST + PREDICTIVE ════════════════════════════════════════════════ */}
      <section id="trust" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-2">
          {/* Trust card */}
          <div className="relative overflow-hidden rounded-[28px] bg-navy-950 p-8 text-white shadow-2xl shadow-navy-900/40">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_0%,rgba(59,130,246,0.18),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(30,64,175,0.12),transparent)]" />
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <svg className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Trust center</p>
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
                Security and AI data boundaries visible before procurement asks.
              </h2>
              <p className="mt-3 text-sm leading-7 text-navy-300">
                HR buyers need proof that employee data, AI prompts, document outputs, audit logs, and regional privacy requirements are treated as core product concerns.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["SOC2 readiness", "GDPR controls", "AI data usage policy", "Audit logs"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white">
                    <svg className="h-3.5 w-3.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/trust" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-navy-950 hover:bg-blue-50 transition-colors">
                Open Trust Center
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Predictive AI card */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Predictive action</p>
            <h3 className="text-2xl font-extrabold text-navy-950 leading-tight">
              Atlas AI shows risk{" "}
              <span className="bg-linear-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                and recommends the next step.
              </span>
            </h3>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-900">Engineering turnover risk increased.</p>
                    <p className="mt-1 text-sm leading-relaxed text-rose-800/80">Suggested: trigger a workload pulse survey, review manager 1:1 notes, and open the retention playbook for critical roles.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Two internal candidates are ready for promotion review.</p>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-800/80">Suggested: schedule calibration and attach skills graph evidence to the manager cockpit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-linear-to-br from-navy-950 via-blue-900 to-blue-700 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        {/* Background overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="mx-auto max-w-4xl text-center relative">
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
            Give every public page a path into a real Atlas workflow.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-blue-100 max-w-2xl mx-auto">
            Visitors move from education to calculator, from calculator to checklist, and from checklist to a saved workflow in the product.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up?intent=global-hr-suite"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-blue-700 hover:bg-blue-50 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5"
            >
              Start free — no card needed
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-white/20 backdrop-blur transition-all"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card · Set up in minutes · Cancel any time</p>
        </div>
      </section>
    </div>
  );
}
