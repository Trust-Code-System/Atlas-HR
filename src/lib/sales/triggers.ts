export type SalesTriggerInput = {
  plan?: string | null;
  employeeCount?: number | null;
  feature?: "sso" | "custom_reports" | "api_access" | "advanced_compliance" | "enterprise";
  businessTrialDaysLeft?: number | null;
};

export type SalesTrigger = {
  title: string;
  message: string;
  cta: string;
  href: string;
};

export function getSalesTrigger(input: SalesTriggerInput): SalesTrigger | null {
  const plan = input.plan ?? "free";
  const employeeCount = input.employeeCount ?? 0;

  if (employeeCount >= 100) {
    return {
      title: "Enterprise support may fit this workspace",
      message: "You have enough employees for implementation planning, custom contracts, and rollout support to matter.",
      cta: "Talk to sales",
      href: "/demo?source=employee-count",
    };
  }

  if (input.feature === "sso" || input.feature === "api_access") {
    return {
      title: "This is an Enterprise feature",
      message: "SSO and API access are handled through Enterprise pilots so we can scope security, contracts, and implementation.",
      cta: "Request Enterprise demo",
      href: "/demo?source=enterprise-feature",
    };
  }

  if (plan === "business" && typeof input.businessTrialDaysLeft === "number" && input.businessTrialDaysLeft <= 5) {
    return {
      title: "Trial ending soon",
      message: "Book a rollout check before the trial ends so pricing, seats, and implementation are clear.",
      cta: "Book rollout call",
      href: "/demo?source=trial-ending",
    };
  }

  if (plan === "team" && (input.feature === "custom_reports" || input.feature === "advanced_compliance")) {
    return {
      title: "Business unlocks this workflow",
      message: "Custom reports, country-aware compliance flags, and deeper workflow controls are part of the Business tier.",
      cta: "Compare Business",
      href: "/pricing?recommended=business",
    };
  }

  return null;
}
