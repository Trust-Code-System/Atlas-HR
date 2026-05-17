import type { FeatureKey, UserRole } from "@/lib/limits";

export type UpgradeRecommendation = {
  targetPlan: "pro" | "team" | "business" | "enterprise";
  title: string;
  message: string;
};

export function recommendUpgrade(input: {
  role: UserRole;
  feature?: FeatureKey;
  employeeCount?: number;
  toolGenerationsUsed?: number;
  creatingWorkspace?: boolean;
}): UpgradeRecommendation | null {
  if (input.role === "free" && (input.toolGenerationsUsed ?? 0) >= 5) {
    return {
      targetPlan: "pro",
      title: "Upgrade to Pro",
      message: "Pro unlocks unlimited tool generations and Copilot messages.",
    };
  }

  if (input.role === "pro" && input.creatingWorkspace) {
    return {
      targetPlan: "team",
      title: "Upgrade to Team",
      message: "Team unlocks the full HRIS workspace for running employee operations.",
    };
  }

  if ((input.role === "team_admin" || input.role === "team_member") && (input.employeeCount ?? 0) >= 50) {
    return {
      targetPlan: "business",
      title: "Upgrade to Business",
      message: "Business supports unlimited employees and deeper operational controls.",
    };
  }

  if (
    input.role.startsWith("team_") &&
    ["custom_reports", "custom_workflows", "internal_helpdesk", "surveys", "compliance_flags"].includes(input.feature ?? "")
  ) {
    return {
      targetPlan: "business",
      title: "Business feature",
      message: "Custom workflows, custom reports, helpdesk, surveys, and advanced compliance flags are available on Business.",
    };
  }

  return null;
}
