"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

type Plan = {
  name: string;
  monthly: { price: string; period?: string; note?: string };
  yearly: { price: string; period?: string; note?: string };
  description: string;
  highlight: boolean;
  badge?: string;
  cta: string;
  ctaHref: string;
  features: string[];
  unavailable: string[];
};

const plans: Plan[] = [
  {
    name: "Free",
    monthly: { price: "£0", period: "forever" },
    yearly: { price: "£0", period: "forever" },
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
    monthly: { price: "£19", period: "per user/month" },
    yearly: { price: "£15", period: "per user/month", note: "billed annually" },
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
    unavailable: ["Custom branding", "SSO / SAML"],
  },
  {
    name: "Enterprise",
    monthly: { price: "Custom", period: "contact us" },
    yearly: { price: "Custom", period: "contact us" },
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

export function PricingPlans() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Billing toggle */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-navy-50 p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              cycle === "monthly"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-navy-500 hover:text-navy-800"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              cycle === "yearly"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-navy-500 hover:text-navy-800"
            )}
          >
            Yearly
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-3">
        {plans.map((plan) => {
          const pricing = cycle === "monthly" ? plan.monthly : plan.yearly;
          return (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.highlight
                  ? "border-blue-600 bg-white shadow-xl shadow-green-50 ring-2 ring-blue-600"
                  : "border-navy-200 bg-white shadow-sm"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-bold text-navy-900">{plan.name}</h3>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-navy-900">
                    {pricing.price}
                  </span>
                  {pricing.period && (
                    <span className="text-sm text-navy-400">{pricing.period}</span>
                  )}
                </div>
                <div className="mb-2 h-4">
                  {pricing.note && (
                    <span className="text-xs font-medium text-blue-700">
                      {pricing.note}
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy-500">{plan.description}</p>
              </div>

              <Link
                href={plan.ctaHref}
                className={cn(
                  "mb-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all",
                  plan.highlight
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "border-2 border-navy-200 text-navy-700 hover:border-navy-300 hover:bg-navy-50"
                )}
              >
                {plan.cta}
              </Link>

              <ul className="flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-navy-700"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.unavailable.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-navy-300 line-through"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-navy-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
