import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes.",
};

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "For individuals and small teams getting started.",
    highlight: false,
    cta: "Get started free",
    ctaHref: "/sign-up",
    features: [
      "Up to 5 AI document generations/month",
      "20 Copilot messages/day",
      "5 employees in HRIS",
      "Basic leave management",
      "HR templates library",
      "Email support",
    ],
    unavailable: [
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "SSO / SAML",
    ],
  },
  {
    name: "Pro",
    price: "£19",
    period: "per user/month",
    description: "For growing HR teams that need more power.",
    highlight: true,
    badge: "Most popular",
    cta: "Start Pro trial",
    ctaHref: "/sign-up",
    features: [
      "Unlimited AI document generations",
      "Unlimited Copilot messages",
      "Unlimited employees",
      "Advanced leave policies",
      "Analytics & reporting",
      "Custom document templates",
      "Priority email support",
      "Audit logs",
    ],
    unavailable: [
      "Custom branding",
      "SSO / SAML",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organisations with complex needs.",
    highlight: false,
    cta: "Contact sales",
    ctaHref: "mailto:sales@atlashr.com",
    features: [
      "Everything in Pro",
      "Custom branding",
      "SSO / SAML integration",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
      "Custom data retention",
    ],
    unavailable: [],
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes — all paid plans come with a 14-day free trial. No credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards via Stripe. Enterprise customers can pay by invoice.",
  },
  {
    q: "How does the free plan work?",
    a: "The Free plan is free forever with no time limit. You can upgrade at any time to unlock more features.",
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col",
                  plan.highlight
                    ? "border-blue-600 bg-white shadow-xl shadow-green-50 ring-2 ring-blue-600"
                    : "border-navy-200 bg-white shadow-sm"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-navy-900 text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-navy-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-navy-400 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-navy-500 text-sm">{plan.description}</p>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={cn(
                    "block text-center font-semibold py-3 rounded-xl transition-all text-sm mb-8",
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      : "border-2 border-navy-200 hover:border-navy-300 hover:bg-navy-50 text-navy-700"
                  )}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-navy-700">
                      <svg className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.unavailable.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-navy-300 line-through">
                      <svg className="h-4 w-4 text-navy-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
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
