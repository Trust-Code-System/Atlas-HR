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
