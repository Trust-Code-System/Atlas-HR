import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "About | Atlas HR",
  description:
    "Atlas HR builds an all-in-one HR platform for modern, growing teams — combining global hiring, compliance, and automation with responsible AI and human decision-making.",
};

const values = [
  {
    title: "Humans decide, AI assists",
    body: "Atlas AI drafts, researches, and flags risks — but people stay in control of hiring, compliance, and employee decisions. We build human review into the workflow, not around it.",
  },
  {
    title: "Built for the whole world",
    body: "Employment rules differ from Lagos to London to Bengaluru. We treat country-specific compliance as a first-class feature, not an afterthought.",
  },
  {
    title: "One connected system",
    body: "HR, IT, payroll, and documents should not live in five disconnected tools. Atlas HR ties them together so a single change ripples through every workflow.",
  },
  {
    title: "Trust by design",
    body: "Role-based access, audit trails, and privacy controls are foundations of the product, because HR systems hold some of the most sensitive data a company owns.",
  },
];

const stats = [
  { value: "4", label: "Countries with tailored compliance journeys" },
  { value: "1", label: "Platform for hiring, ops, and automation" },
  { value: "100%", label: "Human oversight on high-risk decisions" },
];

export default function AboutPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              About Atlas HR
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              HR software that keeps up with how teams actually grow.
            </h1>
            <p className="mt-6 text-base leading-8 text-navy-200 sm:text-lg">
              Atlas HR started with a simple frustration: growing teams were
              stitching together spreadsheets, generic HR tools, and country-by-country
              legal advice just to hire and manage people. We built one platform
              that handles global hiring, compliance, and people operations — with
              AI that helps and humans who decide.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Our mission
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
              Make world-class HR operations available to every growing team.
            </h2>
          </div>
          <p className="text-base leading-8 text-slate-600">
            Great HR shouldn&apos;t require a large team or an expensive stack of
            disconnected software. Atlas HR gives lean teams the same
            compliance confidence, automation, and employee experience that
            large enterprises spend years building — in a single platform they
            can turn on today.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              What we believe
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
              The principles behind the product.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-navy-950">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {value.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
            >
              <div className="text-4xl font-bold text-blue-700">
                {stat.value}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-4xl rounded-2xl bg-navy-950 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Want to work with us or learn more?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-navy-300">
            We&apos;d love to hear from teams building the future of work. Reach
            out and let&apos;s talk.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Contact us
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
