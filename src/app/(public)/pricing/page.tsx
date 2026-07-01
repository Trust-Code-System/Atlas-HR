import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";
import { PricingPlans } from "./pricing-plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes.",
};

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "How do I try Pro?",
    a: "Every account starts on the Free plan — free forever, no credit card. You can upgrade to Pro whenever you're ready, and switch or cancel at any time.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept major credit and debit cards through a secure payment processor. Enterprise customers can pay by invoice.",
  },
  {
    q: "How does the free plan work?",
    a: "The Free plan is free forever with no time limit. You can upgrade at any time to unlock more features.",
  },
  {
    q: "What's the difference between monthly and yearly billing?",
    a: "Yearly billing saves you 20% compared to paying monthly. You're billed once for the year, and you can switch between monthly and yearly at any time.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden bg-navy-950 pt-20 pb-32 text-center px-4">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase mb-4">
            Pricing
          </p>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-navy-300 text-lg">
            Start free. Scale as you grow. No hidden fees, ever.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-white pb-24 pt-10 sm:pt-12">
        <PricingPlans />
      </section>

      {/* FAQs */}
      <section className="bg-navy-50 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-navy-200 p-6">
                <h3 className="font-semibold text-navy-900 mb-2">{faq.q}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-900 py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start for free today
          </h2>
          <p className="text-navy-300 mb-8">
            No credit card required. Set up in minutes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all"
          >
            Create free account →
          </Link>
        </div>
      </section>
    </>
  );
}
