import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Contact | Atlas HR",
  description:
    "Get in touch with the Atlas HR team. Email us at hello@atlashr.com for sales, support, partnerships, or general questions.",
};

const CONTACT_EMAIL = "hello@atlashr.com";

const reasons = [
  {
    title: "Sales & demos",
    body: "See how Atlas HR fits your team and get a walkthrough of global hiring, compliance, and automations.",
  },
  {
    title: "Support",
    body: "Already using Atlas HR? Reach out and our team will help you get unblocked.",
  },
  {
    title: "Partnerships",
    body: "Interested in integrating with Atlas HR or working together? We'd love to talk.",
  },
];

export default function ContactPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Contact Atlas HR
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              Let&apos;s talk.
            </h1>
            <p className="mt-6 text-base leading-8 text-navy-200 sm:text-lg">
              Questions about the product, pricing, or getting started? Send us a
              note and a real person will get back to you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Email {CONTACT_EMAIL}
              </a>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="grid gap-5 sm:grid-cols-3">
                {reasons.map((reason) => (
                  <article
                    key={reason.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <h2 className="text-lg font-bold text-navy-950">
                      {reason.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {reason.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-navy-950 p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                Email us
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                One inbox for everything.
              </h2>
              <p className="mt-4 text-sm leading-7 text-navy-300">
                Whatever your question, the fastest way to reach us is email.
                We typically reply within one business day.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
