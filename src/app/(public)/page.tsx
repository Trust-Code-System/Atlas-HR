import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Globe2,
  Handshake,
  Landmark,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";

const smoothTransition =
  "transition-[background-color,border-color,box-shadow,color,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCNBjLNcuVqzqBPBu5_ffbiTHDi5473K-v-DOFKUEy3QFO1wLHdyP2Lq8Hs9X3dgX7ej6OBluLyYS5lDYJ-r7DwKvqCfn-v2jBt5PQygK9tBmyN9mNMlhr-NogPMso7msrN8VifgRCvm6LjZD3yTlugN2o3pRTsJh403NVzQrT4O6tgTkFVDiNFgfbLo1hHh5NchGdWs6nnDloMa1YeEl4seSu4JoWJk7YlmUnWFflMXC5f48rLxAD11Sftgt6oiYtClMaOTafatsY";

const countryImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAiJ_--UeAWxNv0ZmhUZhi5whmUy6Fc810QVs8Qa8dd50viig7rJbLPox3NCrOvIr-pow9ZmRAAelQW2qq9NNdkxJJ4uTkEfwZOELVJWqvEqz0F5DMSSbfv0YmqC4tBUnYT-FsAujc1t0lYOPErMhQk_lw9Yb9OCCnvbH1Ec8WlfkaJybEZE4wGbtv5gmfVsTzZNBVDyMDOxYYOb1PeX7DQUtrw-uA5wT9IGOY-iXb2Nv39FHQRuAKmLAp4_Anmf_FM3JF0cOBjpYg";

const stats = [
  { value: "500+", label: "Global enterprises" },
  { value: "45%", label: "Efficiency boost" },
  { value: "$2M+", label: "Payroll managed" },
  { value: "24/7", label: "Local support" },
];

const pillars = [
  {
    title: "Knowledge",
    description: "Deep local labor law repositories that stay current as regulations change in Lagos, Manila, Mumbai, and beyond.",
    href: "/knowledge",
    icon: BookOpen,
    featured: true,
  },
  {
    title: "Tools",
    description: "Custom payroll, policy, and document workflows designed for multi-currency teams and local obligations.",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "Community",
    description: "A network of local HR professionals and verified service providers across every operating hub.",
    href: "/community",
    icon: UsersRound,
  },
];

const countries = [
  {
    code: "NG",
    name: "Nigeria",
    detail: "Automated P.A.Y.E, pension, and NHF filing workflows for state and federal requirements.",
  },
  {
    code: "US",
    name: "United States",
    detail: "FLSA classification checks, multi-state tax guidance, and benefits administration support.",
  },
  {
    code: "UK",
    name: "United Kingdom",
    detail: "HMRC RTI payroll submission support and auto-enrolment pension management.",
  },
  {
    code: "IN",
    name: "India",
    detail: "EPF, ESI, professional tax, and configurable LTA/HRA component guidance.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Atlas HR",
  applicationCategory: "BusinessApplication",
  description:
    "The world's first all-in-one platform for HR professionals. Tools, knowledge, community, and an AI copilot - built for every country, every company size, every industry.",
  url: "https://atlashr.app",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available",
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[--bg-app]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[--bg-app]/88 dark:bg-[--bg-app]/82" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[--bg-app] to-transparent" />

        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1280px] flex-col justify-center px-4 pb-14 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--bg-card]/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[--accent] shadow-sm backdrop-blur">
              <Globe2 aria-hidden="true" size={15} />
              Global expansion ready
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[--text-primary] sm:text-5xl lg:text-6xl">
              HR knowledge that knows <span className="italic text-[--accent]">where</span> you work
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[--text-secondary] sm:text-lg">
              The global human resources platform built with deep localized intelligence for teams scaling in Nigeria, India, Kenya, and the Philippines.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className={`${smoothTransition} inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[--accent] px-6 text-sm font-semibold text-[--primary-foreground] shadow-lg hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30`}
              >
                Get started free
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link
                href="/demo"
                className={`${smoothTransition} inline-flex h-12 items-center justify-center rounded-xl border border-[--border] bg-[--bg-card]/90 px-6 text-sm font-semibold text-[--text-primary] backdrop-blur hover:bg-[--bg-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30`}
              >
                Book a demo
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 rounded-xl border border-[--border] bg-[--bg-card]/90 p-4 shadow-xl backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <p className="text-2xl font-semibold text-[--accent]">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[--text-tertiary]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[--border] bg-[--bg-input] py-6">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {[
            ["Nigeria", "P.A.Y.E ready"],
            ["India", "EPF and ESI aware"],
            ["Kenya", "Severance guidance"],
            ["Philippines", "Overtime rules"],
          ].map(([country, detail]) => (
            <div key={country} className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[--accent-soft] text-sm font-bold text-[--accent]">
                {country.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-[--text-primary]">{country}</p>
                <p className="text-xs text-[--text-tertiary]">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-normal text-[--text-primary] md:text-4xl">
            Everything you need, everywhere you are
          </h2>
          <p className="mt-4 text-base leading-7 text-[--text-secondary]">
            One unified system to manage your most valuable asset across borders, languages, and time zones.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className={`${smoothTransition} group rounded-xl border border-[--border] bg-[--bg-card] p-6 hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30 ${
                pillar.featured ? "md:col-span-2 bg-[--accent-soft]" : ""
              }`}
            >
              <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[--bg-app] text-[--accent] group-hover:bg-[--accent] group-hover:text-[--primary-foreground]">
                <pillar.icon aria-hidden="true" size={24} />
              </span>
              <h3 className="text-xl font-semibold text-[--text-primary]">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[--text-secondary]">{pillar.description}</p>
              {pillar.featured && (
                <div className="mt-8 overflow-hidden rounded-lg border border-[--accent]/20 bg-[--bg-card]/70">
                  <div className="flex items-center gap-2 border-b border-[--accent]/20 p-3">
                    <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-300" />
                    <span className="text-xs font-semibold text-[--accent]">NGA Labor Act update synced</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3">
                    <span className="h-2 rounded-full bg-[--accent-soft]" />
                    <span className="h-2 rounded-full bg-[--accent-soft]" />
                    <span className="h-2 rounded-full bg-[--accent-soft]" />
                  </div>
                </div>
              )}
            </Link>
          ))}

          <div className="relative overflow-hidden rounded-xl border border-[--border] bg-[--text-primary] p-6 text-[--bg-app] md:col-span-4 md:p-8">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[--accent] px-3 py-1 text-xs font-semibold text-[--primary-foreground]">
                  <Sparkles aria-hidden="true" size={14} />
                  Beta access
                </div>
                <h3 className="text-3xl font-semibold tracking-normal">AI Copilot</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-[--bg-app]/75">
                  Our AI does not just chat; it files. Ask it to calculate severance for a 3-year employee in Kenya and it generates the compliant report.
                </p>
              </div>
              <div className="rounded-xl border border-[--bg-app]/10 bg-[--bg-card] p-4 font-mono text-sm shadow-2xl">
                <div className="mb-4 flex items-center gap-2 border-b border-[--border] pb-3">
                  <span className="size-3 rounded-full bg-red-600 dark:bg-red-300" />
                  <span className="size-3 rounded-full bg-amber-600 dark:bg-amber-300" />
                  <span className="size-3 rounded-full bg-emerald-600 dark:bg-emerald-300" />
                  <span className="ml-2 text-xs text-[--text-tertiary]">atlas_copilot.ai</span>
                </div>
                <div className="space-y-3">
                  <p className="text-[--accent]">User: What is the overtime rate in the Philippines?</p>
                  <p className="text-[--text-primary]">
                    Copilot: For work beyond 8 hours on a regular workday, employees are entitled to an additional 25% of hourly rate.
                  </p>
                  <div className="h-10 rounded-lg border border-[--accent] bg-[--accent-soft]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[--bg-input] py-24">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[--accent-soft] text-[--accent]">
              <Landmark aria-hidden="true" size={24} />
            </div>
            <h2 className="text-3xl font-semibold tracking-normal text-[--text-primary] md:text-4xl">
              Localized expertise at scale
            </h2>
            <p className="mt-5 text-base leading-7 text-[--text-secondary]">
              Global platforms often miss the nuances. Atlas HR country modules handle the complexity so expanding teams can move with confidence.
            </p>
            <div className="mt-8 space-y-4">
              {countries.map((country) => (
                <div key={country.code} className="flex gap-4 rounded-xl border border-[--border] bg-[--bg-card] p-4 shadow-sm">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[--accent-soft] text-sm font-bold text-[--accent]">
                    {country.code}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[--text-primary]">{country.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-[--text-secondary]">{country.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-[--border] bg-[--bg-card] shadow-2xl lg:min-h-[600px]">
            <div
              aria-label="Global business districts representing Atlas HR country coverage"
              role="img"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${countryImage})` }}
            />
            <div className="absolute inset-0 bg-[--accent-soft]/25" />
            <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-[--border] bg-[--bg-card]/90 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <Network aria-hidden="true" className="text-[--accent]" size={22} />
                <div>
                  <p className="text-sm font-semibold text-[--text-primary]">Country modules connected</p>
                  <p className="text-xs text-[--text-secondary]">Compliance, payroll, policy, and people operations in one workspace.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Localized compliance", text: "Country-specific guidance keeps HR decisions grounded in the right labor law context." },
            { icon: Building2, title: "Enterprise-ready", text: "Built for repeatable workflows across teams, departments, entities, and operating regions." },
            { icon: Handshake, title: "Human support", text: "Combine software speed with community knowledge and verified local HR expertise." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-[--border] bg-[--bg-card] p-6">
              <item.icon aria-hidden="true" className="text-[--accent]" size={26} />
              <h3 className="mt-5 text-lg font-semibold text-[--text-primary]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[--text-secondary]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[--accent] px-6 py-14 text-center text-[--primary-foreground] shadow-2xl sm:px-10 md:px-20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-foreground/20">
            <MessageSquareText aria-hidden="true" size={24} />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-normal md:text-4xl">
            Ready to scale without borders?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 opacity-90">
            Set up your workspace in minutes and let Atlas HR help manage the localized work that slows global teams down.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className={`${smoothTransition} inline-flex h-12 items-center justify-center rounded-xl bg-[--primary-foreground] px-6 text-sm font-semibold text-[--accent] hover:bg-[--bg-input] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-foreground]/50`}
            >
              Start your free trial
            </Link>
            <Link
              href="/demo"
              className={`${smoothTransition} inline-flex h-12 items-center justify-center rounded-xl border border-[--primary-foreground]/30 bg-[--primary-foreground]/10 px-6 text-sm font-semibold text-[--primary-foreground] hover:bg-[--primary-foreground]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-foreground]/50`}
            >
              Speak to an expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
