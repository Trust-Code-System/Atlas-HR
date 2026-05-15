import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle,
  FileText,
  Globe,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { ToolsGridStitch } from "./tools-grid-stitch";

export const metadata: Metadata = {
  title: "HR Tools & Generators",
  description:
    "AI generators for HR documents, essential calculators, and policy templates designed to streamline your global workforce operations.",
};

export default function ToolsPage() {
  const tools = TOOLS_CONFIG.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    category: tool.category,
    description: tool.description,
    icon: tool.icon,
    toolType: tool.toolType,
    inputs: tool.inputs,
  }));

  const aiToolCount = tools.filter((t) => t.toolType !== "calculator").length;
  const calcToolCount = tools.filter((t) => t.toolType === "calculator").length;

  return (
    <main className="bg-[--bg-app]">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[--accent-soft] px-3 py-1 text-sm font-semibold text-[--accent]">
              <Sparkles size={14} aria-hidden />
              AI-powered HR tools
            </div>
            <h1 className="mb-5 text-4xl font-bold tracking-tight text-[--text-primary] sm:text-5xl">
              Every HR document,
              <br className="hidden sm:block" /> drafted in seconds
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-[--text-secondary]">
              {aiToolCount} AI generators for HR documents plus {calcToolCount} essential
              calculators — built for global workforce operations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#tools"
                className="inline-flex items-center gap-2 rounded-xl bg-[--accent] px-6 py-3 text-base font-semibold text-[--primary-foreground] transition-colors hover:bg-[--accent-hover]"
              >
                Explore tools
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-[--border] bg-[--bg-card] px-6 py-3 text-base font-semibold text-[--text-primary] transition-colors hover:border-[--accent] hover:text-[--accent]"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Copilot chat mockup */}
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--bg-card] shadow-[var(--shadow-dropdown)]">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-[--border] bg-[--bg-hover] px-4 py-3">
                <span className="size-3 rounded-full bg-[--danger]" />
                <span className="size-3 rounded-full bg-[--warning]" />
                <span className="size-3 rounded-full bg-[--success]" />
                <span className="ml-3 flex items-center gap-1.5 text-xs font-semibold text-[--text-secondary]">
                  <Bot size={13} aria-hidden />
                  Atlas Copilot
                </span>
              </div>
              {/* Messages */}
              <div className="space-y-4 p-5">
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-[--accent] px-3.5 py-2.5 text-sm text-[--primary-foreground]">
                    Draft a 90-day onboarding plan for a new Sales Manager in Nigeria.
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--accent-soft] text-[--accent]">
                    <Sparkles size={14} aria-hidden />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-[--border] bg-[--bg-hover] px-3.5 py-2.5 text-sm text-[--text-primary]">
                    <p className="mb-2 font-semibold">90-Day Onboarding Plan</p>
                    <p className="text-[--text-secondary]">
                      Here&apos;s a structured plan tailored for Nigerian labour law and your
                      sales org...
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--accent-soft] text-[--accent]">
                    <Sparkles size={14} aria-hidden />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-[--border] bg-[--bg-hover] px-3.5 py-2.5 text-sm text-[--text-secondary]">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[--accent]" />
                    <span className="ml-2">Generating weeks 1–4...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Atlas Copilot Featured ─────────────────── */}
      <section className="bg-[--accent] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[--primary-foreground]/15 px-3 py-1 text-sm font-semibold text-[--primary-foreground]">
                <Zap size={14} aria-hidden />
                Flagship feature
              </div>
              <h2 className="mb-4 text-3xl font-bold text-[--primary-foreground] sm:text-4xl">
                Atlas Copilot — your always-on HR expert
              </h2>
              <p className="mb-8 text-base leading-relaxed text-[--primary-foreground]/80">
                Ask anything about HR policy, labour law, or workforce management. Copilot drafts
                compliant documents, answers questions, and guides decisions — all grounded in 40+
                country jurisdictions.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-[--primary-foreground] px-6 py-3 text-base font-semibold text-[--accent] transition-opacity hover:opacity-90"
              >
                Try Copilot free
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
            <ul className="space-y-4">
              {(
                [
                  { Icon: Globe, text: "Jurisdiction-aware answers for 40+ countries" },
                  { Icon: FileText, text: "Instantly drafts contracts, policies & letters" },
                  {
                    Icon: ShieldCheck,
                    text: "Grounded in verified legal sources — not guesswork",
                  },
                  { Icon: Sparkles, text: "Context-aware: remembers your org's policies" },
                ] as const
              ).map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--primary-foreground]/15">
                    <Icon size={16} className="text-[--primary-foreground]" aria-hidden />
                  </div>
                  <p className="text-base text-[--primary-foreground]/90">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ───────────────────────────────── */}
      <section id="tools" className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-10">
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-[--text-primary]">
            All HR tools
          </h2>
          <p className="text-base text-[--text-secondary]">
            Browse by category or filter by type.
          </p>
        </div>
        <ToolsGridStitch tools={tools} />
      </section>

      {/* ── Free vs Pro ──────────────────────────────── */}
      <section className="border-t border-[--border] bg-[--bg-card] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold text-[--text-primary]">
              Free tools, and pro AI power
            </h2>
            <p className="text-base text-[--text-secondary]">
              Calculators are free forever. Upgrade for unlimited AI generation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-[--border] bg-[--bg-app] p-8">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[--text-tertiary]">
                Free
              </p>
              <p className="mb-1 text-4xl font-bold text-[--text-primary]">$0</p>
              <p className="mb-6 text-sm text-[--text-secondary]">No credit card required</p>
              <ul className="space-y-3">
                {[
                  `${calcToolCount} HR calculators`,
                  "Turnover & cost analysis",
                  "Salary benchmarking",
                  "Unlimited uses",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[--text-primary]">
                    <CheckCircle size={16} className="shrink-0 text-[--success]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block rounded-xl border border-[--border] py-3 text-center text-sm font-semibold text-[--text-primary] transition-colors hover:border-[--accent] hover:text-[--accent]"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-[--accent] bg-[--bg-card] p-8">
              <div className="absolute -top-3 left-6 rounded-full bg-[--accent] px-3 py-0.5 text-xs font-semibold text-[--primary-foreground]">
                Most popular
              </div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[--accent]">
                Pro
              </p>
              <p className="mb-1 text-4xl font-bold text-[--text-primary]">
                $19
                <span className="text-lg font-normal text-[--text-secondary]">/mo</span>
              </p>
              <p className="mb-6 text-sm text-[--text-secondary]">
                Or $190/yr —{" "}
                <Link href="/pricing" className="text-[--accent] underline underline-offset-2">
                  see all plans
                </Link>
              </p>
              <ul className="space-y-3">
                {[
                  "Everything in Free",
                  `${aiToolCount} AI document generators`,
                  "Atlas Copilot assistant",
                  "40+ country compliance",
                  "Unlimited generations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[--text-primary]">
                    <CheckCircle size={16} className="shrink-0 text-[--accent]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block rounded-xl bg-[--accent] py-3 text-center text-sm font-semibold text-[--primary-foreground] transition-colors hover:bg-[--accent-hover]"
              >
                Start Pro free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sign-up CTA ──────────────────────────────── */}
      <section className="bg-[--accent] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[--primary-foreground] sm:text-4xl">
            Ready to streamline your HR work?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[--primary-foreground]/80">
            Join thousands of HR teams using Atlas to draft documents, stay compliant, and move
            faster.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-[--primary-foreground] px-8 py-3.5 text-base font-semibold text-[--accent] transition-opacity hover:opacity-90"
            >
              Start free trial
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-[--primary-foreground]/30 px-8 py-3.5 text-base font-semibold text-[--primary-foreground] transition-colors hover:border-[--primary-foreground]/60"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
