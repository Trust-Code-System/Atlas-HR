export const WORKSPACE_ROLES = [
  "workspace_owner",
  "hr_admin",
  "hr_manager",
  "finance",
  "people_manager",
  "recruiter",
  "employee",
  "viewer",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export type Permission =
  | "billing"
  | "manage_org"
  | "manage_admins"
  | "all_hr"
  | "manage_employees"
  | "manage_documents"
  | "approve_all"
  | "view_compensation"
  | "view_payroll"
  | "export_compensation"
  | "view_team"
  | "approve_team"
  | "review_team"
  | "view_self"
  | "submit_self"
  | "manage_candidates"
  | "manage_jobs"
  | "view_employees"
  | "view_reports"
  | "manage_settings";

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  workspace_owner: "Workspace owner",
  hr_admin: "HR admin",
  hr_manager: "HR manager",
  finance: "Finance",
  people_manager: "People manager",
  recruiter: "Recruiter",
  employee: "Employee",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  workspace_owner: "Billing, subscription, workspace deletion, and admin management.",
  hr_admin: "Full HR access across people, documents, approvals, reports, and settings.",
  hr_manager: "Operational HR access without billing or admin-role management.",
  finance: "Compensation and payroll-related visibility only.",
  people_manager: "Access to direct and indirect reports for team workflows.",
  recruiter: "Candidate and open-role access for ATS workflows.",
  employee: "Self-service access to personal HR data.",
  viewer: "Read-only access for auditors, contractors, and advisors.",
};

export function normalizeRoles(roles: readonly string[] | null | undefined): WorkspaceRole[] {
  const valid = new Set<string>(WORKSPACE_ROLES);
  const normalized = (roles ?? []).filter((role): role is WorkspaceRole => valid.has(role));
  return normalized.length > 0 ? normalized : ["employee"];
}

export function legacyRoleForRoles(roles: readonly string[]): "admin" | "member" {
  return roles.includes("workspace_owner") || roles.includes("hr_admin") ? "admin" : "member";
}

export function hasRole(roles: readonly string[] | null | undefined, role: WorkspaceRole): boolean {
  return normalizeRoles(roles).includes(role);
}

/**
 * Role → permission map. Mirrors the `role_permissions` seed in
 * supabase/migrations/0016_granular_roles.sql exactly. Keep the two in sync;
 * this copy lets us reason about permissions (and test RBAC) without a DB.
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  workspace_owner: ["billing", "manage_org", "manage_admins", "all_hr"],
  hr_admin: [
    "all_hr",
    "manage_employees",
    "manage_documents",
    "approve_all",
    "view_compensation",
    "view_reports",
    "manage_settings",
  ],
  hr_manager: ["manage_employees", "manage_documents", "approve_all", "view_reports"],
  finance: ["view_compensation", "view_payroll", "export_compensation"],
  people_manager: ["view_team", "approve_team", "review_team"],
  recruiter: ["manage_candidates", "manage_jobs"],
  employee: ["view_self", "submit_self"],
  viewer: ["view_employees", "view_reports"],
};

/** Resolve the full set of permissions granted by a set of roles. */
export function permissionsForRoles(roles: readonly string[] | null | undefined): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of normalizeRoles(roles)) {
    for (const permission of ROLE_PERMISSIONS[role]) set.add(permission);
  }
  return set;
}

/**
 * Named Atlas AI capabilities → the permissions that satisfy each one.
 * A capability is granted if the user holds ANY of the listed permissions
 * (matching `hasAnyPermission`). `has_permission` checks exact keys, so meta
 * permissions like `all_hr` are listed explicitly where they apply.
 */
export const AI_CAPABILITY_PERMISSIONS = {
  canViewTeamData: ["view_team", "all_hr", "manage_employees"],
  canViewAllEmployees: ["all_hr", "manage_employees", "view_employees"],
  canViewSalaryData: ["view_compensation", "view_payroll"],
  canViewMedicalData: ["all_hr"],
  canViewDisciplinaryCases: ["all_hr", "manage_employees"],
  canManagePolicies: ["manage_documents", "all_hr"],
  canCreateDocuments: ["manage_documents", "all_hr"],
  canSendEmails: ["all_hr", "manage_employees"],
  canApproveLeave: ["approve_all", "approve_team"],
  canManageOnboarding: ["manage_employees", "all_hr"],
  canManagePerformance: ["review_team", "all_hr", "manage_employees"],
  canViewAnalytics: ["view_reports", "all_hr"],
  canManageSettings: ["manage_settings", "manage_org"],
  canExecuteRestrictedActions: ["manage_admins", "manage_org"],
} satisfies Record<string, Permission[]>;

export type AiCapability = keyof typeof AI_CAPABILITY_PERMISSIONS;

/** Pure RBAC check: does this set of roles grant the named Atlas capability? */
export function roleCan(roles: readonly string[] | null | undefined, capability: AiCapability): boolean {
  const granted = permissionsForRoles(roles);
  return AI_CAPABILITY_PERMISSIONS[capability].some((p) => granted.has(p));
}
