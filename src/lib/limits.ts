export type UserRole =
  | "free"
  | "pro"
  | "team_admin"
  | "team_member"
  | "business_admin"
  | "business_member"
  | "enterprise"
  | "moderator"
  | "admin";

export type FeatureKey =
  | "unlimited_generations"
  | "premium_templates"
  | "document_history_unlimited"
  | "full_copilot"
  | "mini_hris"
  | "compliance_flags"
  | "custom_reports"
  | "internal_helpdesk"
  | "surveys"
  | "custom_onboarding_templates"
  | "custom_workflows"
  | "sso"
  | "priority_support"
  | "custom_branding"
  | "advanced_analytics"
  | "bulk_employee_import"
  | "api_access";

export interface RoleLimits {
  tool_generations_per_month: number;
  copilot_messages_per_day: number;
  saved_items: number;
  document_history_retention_days: number;
  org_count: number;
  employee_count: number;
}

export const LIMITS: Record<UserRole, RoleLimits> = {
  free: {
    tool_generations_per_month: 20,
    copilot_messages_per_day: 20,
    saved_items: 50,
    document_history_retention_days: 30,
    org_count: 1,
    employee_count: 5,
  },
  pro: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 0,
    employee_count: 0,
  },
  team_admin: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 1,
    employee_count: 50,
  },
  team_member: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 0,
    employee_count: 0,
  },
  business_admin: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 1,
    employee_count: Infinity,
  },
  business_member: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 0,
    employee_count: 0,
  },
  enterprise: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: Infinity,
    employee_count: Infinity,
  },
  moderator: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: 0,
    employee_count: 0,
  },
  admin: {
    tool_generations_per_month: Infinity,
    copilot_messages_per_day: Infinity,
    saved_items: Infinity,
    document_history_retention_days: Infinity,
    org_count: Infinity,
    employee_count: Infinity,
  },
};

const freeFeatures: Record<FeatureKey, boolean> = {
  unlimited_generations: false,
  premium_templates: false,
  document_history_unlimited: false,
  full_copilot: false,
  mini_hris: false,
  compliance_flags: false,
  custom_reports: false,
  internal_helpdesk: false,
  surveys: false,
  custom_onboarding_templates: false,
  custom_workflows: false,
  sso: false,
  priority_support: false,
  custom_branding: false,
  advanced_analytics: false,
  bulk_employee_import: false,
  api_access: false,
};

const proFeatures: Record<FeatureKey, boolean> = {
  ...freeFeatures,
  unlimited_generations: true,
  premium_templates: true,
  document_history_unlimited: true,
  full_copilot: true,
};

const teamAdminFeatures: Record<FeatureKey, boolean> = {
  ...proFeatures,
  mini_hris: true,
  bulk_employee_import: true,
  advanced_analytics: true,
  custom_onboarding_templates: true,
  custom_workflows: true,
};

const teamMemberFeatures: Record<FeatureKey, boolean> = {
  ...proFeatures,
  mini_hris: true,
};

const businessFeatures: Record<FeatureKey, boolean> = {
  ...teamAdminFeatures,
  compliance_flags: true,
  custom_reports: true,
  internal_helpdesk: true,
  surveys: true,
  custom_branding: true,
  priority_support: true,
};

const enterpriseFeatures: Record<FeatureKey, boolean> = {
  unlimited_generations: true,
  premium_templates: true,
  document_history_unlimited: true,
  full_copilot: true,
  mini_hris: true,
  compliance_flags: true,
  custom_reports: true,
  internal_helpdesk: true,
  surveys: true,
  custom_onboarding_templates: true,
  custom_workflows: true,
  sso: true,
  priority_support: true,
  custom_branding: true,
  advanced_analytics: true,
  bulk_employee_import: true,
  api_access: true,
};

export const FEATURES: Record<UserRole, Record<FeatureKey, boolean>> = {
  free: freeFeatures,
  pro: proFeatures,
  team_admin: teamAdminFeatures,
  team_member: teamMemberFeatures,
  business_admin: businessFeatures,
  business_member: businessFeatures,
  enterprise: enterpriseFeatures,
  moderator: proFeatures,
  admin: enterpriseFeatures,
};

export const PLAN_CAPABILITIES = {
  team: {
    custom_onboarding_templates: "limited",
    custom_workflows: "basic",
    audit_log_retention_years: 1,
  },
  business: {
    custom_onboarding_templates: "unlimited",
    custom_workflows: "full",
    audit_log_retention_years: 3,
  },
  enterprise: {
    custom_onboarding_templates: "unlimited",
    custom_workflows: "full",
    audit_log_retention_years: 7,
  },
} as const;

// ─── TEST MODE ───────────────────────────────────────────────────────────────
// Enable only in isolated demo/test environments; production must enforce plan limits.
const TEST_MODE = process.env.ATLAS_TEST_MODE === "true";

export function getLimits(role: UserRole): RoleLimits {
  if (TEST_MODE) return LIMITS.enterprise;
  return LIMITS[role] ?? LIMITS.free;
}

export function isFreeUser(_role: UserRole): boolean {
  if (TEST_MODE) return false;
  return _role === "free";
}

export function hasFeature(_role: UserRole, _feature: FeatureKey): boolean {
  if (TEST_MODE) return true;
  return FEATURES[_role]?.[_feature] ?? false;
}
