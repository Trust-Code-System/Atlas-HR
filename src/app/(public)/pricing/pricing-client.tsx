"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarClock, Check, Loader2, Mail, Minus, Plus, X } from "lucide-react";
import {
  createCheckoutSession,
  createOrgAndCheckout,
} from "@/app/(app)/billing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PLANS, type BillingInterval } from "@/lib/stripe/products";

export type CurrentPricingPlan = "free" | "pro" | "team" | "business" | "enterprise";

type AdminOrg = {
  id: string;
  name: string;
};

type TierName = "Free" | "Pro" | "Team" | "Business" | "Enterprise";

const TIERS: {
  name: TierName;
  description: string;
  highlighted?: boolean;
  badge?: string;
  features: Record<string, boolean | string>;
}[] = [
  {
    name: "Free",
    description: "For HR pros sharpening their craft",
    features: {
      "Knowledge Hub": true,
      "Tool generations": "5/month per tool",
      "Community": "Read + write",
      "Free courses": true,
      "Premium templates": false,
      "All courses": false,
      "Full Copilot": false,
      "Document history": false,
      "Mini-HRIS": false,
      "Advanced compliance": false,
      "Custom workflows": false,
      "Custom reports": false,
      "Employee helpdesk": false,
      "Team workspace": false,
      SSO: false,
    },
  },
  {
    name: "Pro",
    description: "For solo HR pros who want unlimited tools",
    features: {
      "Knowledge Hub": true,
      "Tool generations": "Unlimited",
      "Community": "Read + write",
      "Free courses": true,
      "Premium templates": true,
      "All courses": true,
      "Full Copilot": true,
      "Document history": true,
      "Mini-HRIS": false,
      "Advanced compliance": false,
      "Custom workflows": false,
      "Custom reports": false,
      "Employee helpdesk": false,
      "Team workspace": false,
      SSO: false,
    },
  },
  {
    name: "Team",
    description: "For HR teams running real workforces",
    highlighted: true,
    badge: "Up to 50 employees",
    features: {
      "Knowledge Hub": true,
      "Tool generations": "Unlimited",
      "Community": "Read + write",
      "Free courses": true,
      "Premium templates": true,
      "All courses": true,
      "Full Copilot": true,
      "Document history": true,
      "Mini-HRIS": "Up to 50 employees",
      "Advanced compliance": false,
      "Custom workflows": "Basic",
      "Custom reports": false,
      "Employee helpdesk": false,
      "Team workspace": true,
      SSO: false,
    },
  },
  {
    name: "Business",
    description: "For HR departments that need depth",
    badge: "Best value",
    features: {
      "Knowledge Hub": true,
      "Tool generations": "Unlimited",
      "Community": "Read + write",
      "Free courses": true,
      "Premium templates": true,
      "All courses": true,
      "Full Copilot": true,
      "Document history": true,
      "Mini-HRIS": "Unlimited employees",
      "Advanced compliance": true,
      "Custom workflows": true,
      "Custom reports": true,
      "Employee helpdesk": true,
      "Team workspace": true,
      SSO: false,
    },
  },
  {
    name: "Enterprise",
    description: "For organisations with serious compliance needs",
    features: {
      "Knowledge Hub": true,
      "Tool generations": "Unlimited",
      "Community": "Read + write",
      "Free courses": true,
      "Premium templates": true,
      "All courses": true,
      "Full Copilot": true,
      "Document history": true,
      "Mini-HRIS": "Unlimited",
      "Advanced compliance": true,
      "Custom workflows": true,
      "Custom reports": true,
      "Employee helpdesk": true,
      "Team workspace": true,
      SSO: true,
    },
  },
];

const FAQS = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes. No credit card required and no time limit. You get access to the full Knowledge Hub, 5 tool generations per month per tool, the community, and free courses.",
  },
  {
    q: "Can I change my plan later?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards via Stripe. We also support invoicing for Enterprise plans.",
  },
  {
    q: "Is there a discount for non-profits or NGOs?",
    a: "Yes. NGOs and registered non-profits get 50% off any paid plan. Contact us.",
  },
  {
    q: "What does unlimited mean for Copilot?",
    a: "Pro and above get unlimited AI messages per day. Free users get 20 messages per day.",
  },
  {
    q: "How does Team pricing work?",
    a: "Team starts at $79/month for the workspace plus $7/month per employee, up to 50 employees. Business starts at $199/month plus $10/month per employee.",
  },
];

const FEATURE_KEYS = Object.keys(TIERS[0].features);
const PLAN_ORDER: Record<CurrentPricingPlan, number> = {
  free: 0,
  pro: 1,
  team: 2,
  business: 3,
  enterprise: 4,
};

function tierToPlan(tier: TierName): CurrentPricingPlan {
  return tier.toLowerCase() as CurrentPricingPlan;
}

function priceFor(tier: TierName, interval: BillingInterval) {
  if (tier === "Free") return "$0";
  if (tier === "Enterprise") return "Custom";
  if (tier === "Pro") {
    return interval === "year" ? `$${PLANS.pro.priceYearly}` : `$${PLANS.pro.priceMonthly}`;
  }
  if (tier === "Business") {
    return interval === "year" ? `$${PLANS.business.priceYearly}` : `$${PLANS.business.priceMonthly}`;
  }

  return interval === "year" ? `$${PLANS.team.priceYearly}` : `$${PLANS.team.priceMonthly}`;
}

function intervalSuffix(tier: TierName, interval: BillingInterval) {
  if (tier === "Free" || tier === "Enterprise") return "";
  return interval === "year" ? "/yr" : "/mo";
}

export function PricingClient({
  signedIn,
  currentPlan,
  adminOrgs,
  cancelled,
}: {
  signedIn: boolean;
  currentPlan: CurrentPricingPlan;
  adminOrgs: AdminOrg[];
  cancelled: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [showCancelled, setShowCancelled] = useState(cancelled);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [workspacePlan, setWorkspacePlan] = useState<"team" | "business">("team");
  const [selectedOrgId, setSelectedOrgId] = useState(adminOrgs[0]?.id ?? "");
  const [seats, setSeats] = useState<number>(10);
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [size, setSize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "team" | "business" | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [quiz, setQuiz] = useState({
    companySize: "11-50",
    needsCompliance: false,
    needsCustom: false,
    needsSSO: false,
  });

  const smoothTransition =
    "transition-[background-color,border-color,box-shadow,color,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

  useEffect(() => {
    if (!cancelled) return;
    const timeout = window.setTimeout(() => setShowCancelled(false), 6000);
    return () => window.clearTimeout(timeout);
  }, [cancelled]);

  const activeWorkspacePlan = workspacePlan === "business" ? PLANS.business : PLANS.team;
  const additionalSeats = Math.max(0, seats - activeWorkspacePlan.includedSeats);
  const seatCost = interval === "year" ? activeWorkspacePlan.seatPriceYearly : activeWorkspacePlan.seatPriceMonthly;
  const selectedOrgName = useMemo(
    () => adminOrgs.find((org) => org.id === selectedOrgId)?.name ?? adminOrgs[0]?.name,
    [adminOrgs, selectedOrgId]
  );

  function checkoutPro() {
    setError(null);
    setLoadingPlan("pro");
    createCheckoutSession({ plan: "pro", interval }).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setLoadingPlan(null);
    });
  }

  const recommendedPlan = useMemo(() => {
    if (quiz.needsSSO || quiz.companySize === "251+") return "Enterprise";
    if (quiz.needsCompliance || quiz.needsCustom || quiz.companySize === "51-250") return "Business";
    if (quiz.companySize === "1-10") return "Pro";
    return "Team";
  }, [quiz]);

  function openWorkspaceFlow(plan: "team" | "business") {
    setError(null);
    setWorkspacePlan(plan);
    setSeats(plan === "business" ? 25 : 10);
    if (!signedIn) {
      window.location.href = "/sign-in?redirect=/pricing";
      return;
    }
    if (adminOrgs.length === 0) {
      setOrgDialogOpen(true);
      return;
    }
    setSelectedOrgId((current) => current || adminOrgs[0].id);
    setWorkspaceDialogOpen(true);
  }

  function checkoutWorkspacePlan() {
    if (!selectedOrgId) return;
    setError(null);
    setLoadingPlan(workspacePlan);
    createCheckoutSession({
      plan: workspacePlan,
      interval,
      orgId: selectedOrgId,
      seats,
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setLoadingPlan(null);
    });
  }

  function createOrgThenCheckout() {
    setError(null);
    setLoadingPlan(workspacePlan);
    createOrgAndCheckout({
      plan: workspacePlan,
      orgName,
      industry,
      country,
      size,
      seats,
      interval,
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not create workspace");
      setLoadingPlan(null);
    });
  }

  function renderCta(tier: TierName) {
    const plan = tierToPlan(tier);
    const isCurrent = currentPlan === plan;
    const isLower = PLAN_ORDER[plan] < PLAN_ORDER[currentPlan];

    if (isCurrent) {
      return (
        <Button className="w-full" disabled>
          Current plan
        </Button>
      );
    }

    if (tier === "Free") {
      if (signedIn && isLower) {
        return (
          <Button className="w-full" variant="outline" disabled title="Downgrades are handled in Customer Portal in C.4">
            Downgrade in portal
          </Button>
        );
      }

      return (
        <Button
          className="w-full"
          variant="outline"
          nativeButton={false}
          render={<Link href={signedIn ? "/dashboard" : "/sign-up"} />}
        >
          Get started free
        </Button>
      );
    }

    if (tier === "Pro") {
      if (isLower) {
        return (
          <Button className="w-full" variant="outline" disabled title="Plan changes are handled in Customer Portal in C.4">
            Downgrade in portal
          </Button>
        );
      }

      return (
        <Button
          className="w-full"
          disabled={loadingPlan === "pro"}
          nativeButton={signedIn}
          onClick={signedIn ? checkoutPro : undefined}
          render={!signedIn ? <Link href="/sign-in?redirect=/pricing" /> : undefined}
        >
          {loadingPlan === "pro" ? <Loader2 className="animate-spin" /> : null}
          Start 14-day trial
        </Button>
      );
    }

    if (tier === "Team") {
      if (isLower) {
        return (
          <Button className="w-full" variant="outline" disabled title="Plan changes are handled in Customer Portal in C.4">
            Downgrade in portal
          </Button>
        );
      }

      return (
        <Button className="w-full" disabled={loadingPlan === "team"} onClick={() => openWorkspaceFlow("team")}>
          {loadingPlan === "team" ? <Loader2 className="animate-spin" /> : null}
          Start 14-day trial
        </Button>
      );
    }

    if (tier === "Business") {
      if (isLower) {
        return (
          <Button className="w-full" variant="outline" disabled title="Plan changes are handled in Customer Portal in C.4">
            Downgrade in portal
          </Button>
        );
      }

      return (
        <Button className="w-full" disabled={loadingPlan === "business"} onClick={() => openWorkspaceFlow("business")}>
          {loadingPlan === "business" ? <Loader2 className="animate-spin" /> : null}
          Start 14-day trial
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        variant="outline"
        nativeButton={false}
        render={<Link href="/demo" />}
      >
        <Mail />
        Request demo
      </Button>
    );
  }

  return (
    <div className="min-h-screen bg-[--bg-app] py-16">
      {showCancelled && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-[--border] bg-[--bg-card] px-4 py-3 text-sm text-[--text-secondary] shadow-lg">
          No worries. Let us know if you have questions.
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Badge
            variant="outline"
            className="mb-4 border-transparent bg-[--accent-soft] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[--accent]"
          >
            Pricing plans
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[--text-primary] sm:text-4xl lg:text-5xl">
            Plans that grow with you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[--text-secondary] sm:text-lg">
            Flexible workspace solutions for global teams. Choose the scale that fits your current
            workforce and evolve seamlessly as you expand.
          </p>

          <div
            role="radiogroup"
            aria-label="Billing interval"
            className="mt-7 inline-flex items-center gap-1 rounded-full border border-[--border] bg-[--bg-card] p-1 shadow-sm"
          >
            <button
              type="button"
              role="radio"
              aria-checked={interval === "month" ? "true" : "false"}
              onClick={() => setInterval("month")}
              className={cn(
                "h-9 rounded-full px-5 text-sm font-semibold",
                smoothTransition,
                interval === "month"
                  ? "bg-[--accent] text-[--primary-foreground] shadow-sm"
                  : "text-[--text-secondary] hover:text-[--text-primary]"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={interval === "year" ? "true" : "false"}
              onClick={() => setInterval("year")}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-5 text-sm font-semibold",
                smoothTransition,
                interval === "year"
                  ? "bg-[--accent] text-[--primary-foreground] shadow-sm"
                  : "text-[--text-secondary] hover:text-[--text-primary]"
              )}
            >
              Annual
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  interval === "year"
                    ? "bg-primary-foreground/20 text-[--primary-foreground]"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                )}
              >
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="mx-auto mb-6 max-w-xl rounded-lg border border-[--danger]/30 bg-[--danger]/10 px-4 py-3 text-sm text-[--danger]">
            {error}
          </div>
        )}

        <div className="mb-16 grid gap-5 sm:grid-cols-2 xl:grid-cols-5 xl:items-stretch xl:pt-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              id={tier.name.toLowerCase()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-[--bg-card] p-6",
                smoothTransition,
                tier.highlighted
                  ? "z-10 border-2 border-[--accent] shadow-xl xl:scale-[1.04]"
                  : "border-[--border] hover:-translate-y-0.5 hover:shadow-md"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[--accent] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[--primary-foreground] shadow-sm">
                  Most popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-[--text-primary]">{tier.name}</h3>
                <p className="mt-1 text-sm leading-5 text-[--text-tertiary]">
                  {tier.description}
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-3xl font-extrabold tracking-tight sm:text-4xl",
                      tier.highlighted ? "text-[--accent]" : "text-[--text-primary]"
                    )}
                  >
                    {priceFor(tier.name, interval)}
                  </span>
                  <span className="text-sm font-medium text-[--text-tertiary]">
                    {intervalSuffix(tier.name, interval)}
                  </span>
                </div>
                {(tier.name === "Team" || tier.name === "Business") && (
                  <p className="mt-1 text-xs text-[--text-tertiary]">
                    + $
                    {tier.name === "Business"
                      ? interval === "year"
                        ? PLANS.business.seatPriceYearly
                        : PLANS.business.seatPriceMonthly
                      : interval === "year"
                        ? PLANS.team.seatPriceYearly
                        : PLANS.team.seatPriceMonthly}
                    /employee/{interval === "year" ? "yr" : "mo"}
                  </p>
                )}
                {tier.badge && (
                  <p className="mt-1 text-xs font-medium text-[--text-tertiary]">{tier.badge}</p>
                )}
              </div>

              <ul className="my-6 flex-1 space-y-2">
                {FEATURE_KEYS.map((key) => {
                  const val = tier.features[key];
                  return (
                    <li key={key} className="flex items-start gap-2 text-sm">
                      {val === false ? (
                        <X size={14} className="mt-0.5 shrink-0 text-[--text-tertiary]" />
                      ) : (
                        <Check size={14} className="mt-0.5 shrink-0 text-[--success]" />
                      )}
                      <span
                        className={
                          val === false
                            ? "text-[--text-tertiary]"
                            : "text-[--text-secondary]"
                        }
                      >
                        {key}
                        {typeof val === "string" && ` (${val})`}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {renderCta(tier.name)}
            </motion.div>
          ))}
        </div>

        <div className="mb-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-[--text-tertiary]">
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-[--success]" /> 30-day money-back guarantee
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-[--success]" /> No credit card for free tier
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-[--success]" /> Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-[--success]" /> Stripe Tax supported
          </span>
        </div>

        <section
          aria-labelledby="compare-features-heading"
          className="mb-16 border-t border-[--border] pt-10"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
                Side-by-side
              </p>
              <h2
                id="compare-features-heading"
                className="mt-1 text-2xl font-semibold tracking-tight text-[--text-primary] sm:text-3xl"
              >
                Compare features
              </h2>
            </div>
            <p className="text-sm text-[--text-tertiary]">
              All plans include the Knowledge Hub, free templates, and the public community.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[--border] bg-[--bg-card] shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[--border] bg-[--bg-input]">
                  <th className="w-1/3 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
                    Feature
                  </th>
                  {TIERS.map((tier) => (
                    <th
                      key={tier.name}
                      className={cn(
                        "px-3 py-4 text-center text-xs font-bold uppercase tracking-wider",
                        tier.highlighted ? "text-[--accent]" : "text-[--text-secondary]"
                      )}
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {FEATURE_KEYS.map((featureKey) => (
                  <tr key={featureKey} className={cn("hover:bg-[--bg-input]/50", smoothTransition)}>
                    <td className="px-5 py-3.5 text-sm font-medium text-[--text-primary]">
                      {featureKey}
                    </td>
                    {TIERS.map((tier) => {
                      const value = tier.features[featureKey];
                      return (
                        <td
                          key={tier.name}
                          className={cn(
                            "px-3 py-3.5 text-center text-sm",
                            tier.highlighted ? "font-semibold text-[--accent]" : "text-[--text-secondary]"
                          )}
                        >
                          {value === false ? (
                            <span className="text-[--text-tertiary]" aria-label="Not included">
                              —
                            </span>
                          ) : value === true ? (
                            <Check
                              size={16}
                              className={cn(
                                "mx-auto",
                                tier.highlighted ? "text-[--accent]" : "text-[--success]"
                              )}
                              aria-label="Included"
                            />
                          ) : (
                            <span>{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-4xl rounded-xl border border-[--border] bg-[--bg-card] p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">Which plan is right for me?</p>
            <h2 className="mt-1 text-2xl font-bold text-[--text-primary]">Plan recommendation</h2>
            <p className="mt-1 text-sm text-[--text-secondary]">Answer a few practical questions and Atlas will point you at the right tier.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QuizGroup
              label="Company size"
              options={["1-10", "11-50", "51-250", "251+"]}
              value={quiz.companySize}
              onChange={(companySize) => setQuiz((current) => ({ ...current, companySize }))}
            />
            <ToggleQuestion
              label="Need advanced compliance flags or country-aware reporting?"
              value={quiz.needsCompliance}
              onChange={(needsCompliance) => setQuiz((current) => ({ ...current, needsCompliance }))}
            />
            <ToggleQuestion
              label="Need custom reports, custom workflows, helpdesk, or surveys?"
              value={quiz.needsCustom}
              onChange={(needsCustom) => setQuiz((current) => ({ ...current, needsCustom }))}
            />
            <ToggleQuestion
              label="Need SSO, custom contracts, or dedicated implementation?"
              value={quiz.needsSSO}
              onChange={(needsSSO) => setQuiz((current) => ({ ...current, needsSSO }))}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[--accent-soft] p-4">
            <div>
              <p className="text-sm font-semibold text-[--text-primary]">Recommended plan: {recommendedPlan}</p>
              <p className="mt-1 text-xs text-[--text-secondary]">
                {recommendedPlan === "Business"
                  ? "You need depth beyond the Team tier: custom controls, reporting, or compliance."
                  : recommendedPlan === "Enterprise"
                    ? "Your size or compliance needs are better handled through a sales-led pilot."
                    : recommendedPlan === "Team"
                      ? "You are ready to run real HR operations in a workspace."
                      : "You likely need unlimited individual tools before a workspace."}
              </p>
            </div>
            <Link href={`#${recommendedPlan.toLowerCase()}`} className="rounded-lg bg-[--accent] px-4 py-2 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover]">
              View {recommendedPlan}
            </Link>
          </div>
        </section>

        <div className="mx-auto mb-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-[--text-primary] sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              const panelId = `faq-panel-${i}`;
              const buttonId = `faq-trigger-${i}`;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-[--bg-card]",
                    isOpen ? "border-[--accent]/40 shadow-sm" : "border-[--border]"
                  )}
                >
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen ? "true" : "false"}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-5 py-4 text-left",
                      smoothTransition,
                      "hover:bg-[--bg-input]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/30"
                    )}
                  >
                    <span className="text-base font-semibold text-[--text-primary]">{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        isOpen
                          ? "bg-[--accent]/10 text-[--accent]"
                          : "bg-[--bg-input] text-[--text-tertiary]"
                      )}
                    >
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="border-t border-[--border]/60 px-5 py-4"
                    >
                      <p className="text-sm leading-relaxed text-[--text-secondary]">{faq.a}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <section
          aria-labelledby="pricing-cta-heading"
          className="relative mb-8 overflow-hidden rounded-3xl bg-foreground p-8 text-center text-background sm:p-12"
        >
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-20 top-0 size-80 rounded-full bg-[--accent] blur-3xl" />
            <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[--accent]/60 blur-3xl" />
          </div>
          <div className="relative">
            <h2
              id="pricing-cta-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl"
            >
              Still have questions?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-background/70 sm:text-base">
              Our HR specialists are ready to help you find the right fit for your team&apos;s
              unique requirements.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                className={cn("h-11 rounded-xl px-6 text-sm font-semibold", smoothTransition)}
                nativeButton={false}
                render={<Link href="/demo" />}
              >
                <Mail aria-hidden="true" />
                Talk to sales
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-11 rounded-xl border-background/20 bg-transparent px-6 text-sm font-semibold text-background hover:bg-background/10 hover:text-background",
                  smoothTransition
                )}
                nativeButton={false}
                render={<Link href="/demo" />}
              >
                <CalendarClock aria-hidden="true" />
                Schedule a demo
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose {activeWorkspacePlan.name} employee seats</DialogTitle>
            <DialogDescription>
              Start Checkout for {selectedOrgName}. Employee seats sync from your active employee count after setup.
            </DialogDescription>
          </DialogHeader>

          {adminOrgs.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[--text-tertiary]">
                Workspace
              </p>
              <div className="grid gap-2">
                {adminOrgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      selectedOrgId === org.id
                        ? "border-[--accent] bg-[--accent-soft] text-[--text-primary]"
                        : "border-[--border] text-[--text-secondary]"
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SeatStepper seats={seats} setSeats={setSeats} max={workspacePlan === "team" ? 50 : 1000} />
          {additionalSeats > 0 && (
            <p className="text-sm text-[--text-secondary]">
              {additionalSeats} employee seat{additionalSeats === 1 ? "" : "s"} adds $
              {additionalSeats * seatCost}/{interval === "year" ? "yr" : "mo"} before tax.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkspaceDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={loadingPlan === workspacePlan || !selectedOrgId} onClick={checkoutWorkspacePlan}>
              {loadingPlan === workspacePlan ? <Loader2 className="animate-spin" /> : null}
              Continue to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Team billing is attached to a workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <LabeledInput
              label="Workspace name"
              value={orgName}
              onChange={setOrgName}
              placeholder="Acme People Ops"
            />
            <LabeledInput
              label="Industry"
              value={industry}
              onChange={setIndustry}
              placeholder="Technology"
            />
            <LabeledInput
              label="Country"
              value={country}
              onChange={setCountry}
              placeholder="Nigeria"
            />
            <LabeledInput
              label="Company size"
              value={size}
              onChange={setSize}
              placeholder="11-50"
            />
            <SeatStepper seats={seats} setSeats={setSeats} max={workspacePlan === "team" ? 50 : 1000} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={loadingPlan === workspacePlan || !orgName.trim()} onClick={createOrgThenCheckout}>
              {loadingPlan === workspacePlan ? <Loader2 className="animate-spin" /> : null}
              Create and continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-[--text-primary]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/30"
      />
    </label>
  );
}

function SeatStepper({
  seats,
  setSeats,
  max = 1000,
}: {
  seats: number;
  setSeats: (seats: number) => void;
  max?: number;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-[--text-tertiary]">
        Employees
      </p>
      <div className="flex h-10 items-center justify-between rounded-lg border border-[--border] bg-[--bg-input] px-2">
        <button
          type="button"
          onClick={() => setSeats(Math.max(1, seats - 1))}
          className="flex size-7 items-center justify-center rounded-md text-[--text-secondary] hover:bg-[--bg-hover]"
          aria-label="Reduce seats"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-semibold text-[--text-primary]">{seats}</span>
        <button
          type="button"
          onClick={() => setSeats(Math.min(max, seats + 1))}
          className="flex size-7 items-center justify-center rounded-md text-[--text-secondary] hover:bg-[--bg-hover]"
          aria-label="Add seats"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function QuizGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[--text-primary]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              value === option
                ? "border-[--accent] bg-[--accent] text-[--primary-foreground]"
                : "border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex min-h-12 items-center justify-between gap-4 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        value
          ? "border-[--accent] bg-[--accent-soft] text-[--text-primary]"
          : "border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]"
      }`}
    >
      <span>{label}</span>
      <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${value ? "bg-[--accent]" : "bg-[--bg-hover]"}`}>
        <span className={`h-4 w-4 rounded-full bg-primary-foreground transition-transform ${value ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
