import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";
import type { Permission } from "@/lib/auth/permissions-shared";

export * from "@/lib/auth/permissions-shared";

export async function hasPermission(orgId: string, permission: Permission): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_permission", {
    _org_id: orgId,
    _permission: permission,
  });

  return data ?? false;
}

export async function hasAnyPermission(orgId: string, permissions: Permission[]): Promise<boolean> {
  const checks = await Promise.all(permissions.map((permission) => hasPermission(orgId, permission)));
  return checks.some(Boolean);
}

export async function getCurrentEmployee(orgId: string): Promise<Employee | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("org_id", orgId)
    .eq("email", user.email)
    .maybeSingle();

  return data ?? null;
}

export async function manages(employeeId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("manages_employee", {
    _employee_id: employeeId,
  });

  return data ?? false;
}

// ─── Atlas AI capability checks ─────────────────────────────────────────────
// Named, server-side permission gates that Atlas AI (and its tools) must call
// before reading sensitive data or preparing an action. Each resolves against
// the live `has_permission` RPC for the given org, so it reflects the user's
// real roles. The capability → permission mapping lives in permissions-shared
// (AI_CAPABILITY_PERMISSIONS) and is mirrored by the pure `roleCan` helper used
// in tests.
import { AI_CAPABILITY_PERMISSIONS, type AiCapability } from "@/lib/auth/permissions-shared";

/** Generic capability check against the live permission model. */
export async function canDo(orgId: string, capability: AiCapability): Promise<boolean> {
  return hasAnyPermission(orgId, AI_CAPABILITY_PERMISSIONS[capability]);
}

/** Any signed-in member may see their own employee data — RLS enforces the scope. */
export function canViewOwnEmployeeData(): boolean {
  return true;
}

export const canViewTeamData = (orgId: string) => canDo(orgId, "canViewTeamData");
export const canViewAllEmployees = (orgId: string) => canDo(orgId, "canViewAllEmployees");
export const canViewSalaryData = (orgId: string) => canDo(orgId, "canViewSalaryData");
export const canViewMedicalData = (orgId: string) => canDo(orgId, "canViewMedicalData");
export const canViewDisciplinaryCases = (orgId: string) => canDo(orgId, "canViewDisciplinaryCases");
export const canManagePolicies = (orgId: string) => canDo(orgId, "canManagePolicies");
export const canCreateDocuments = (orgId: string) => canDo(orgId, "canCreateDocuments");
export const canSendEmails = (orgId: string) => canDo(orgId, "canSendEmails");
export const canApproveLeave = (orgId: string) => canDo(orgId, "canApproveLeave");
export const canManageOnboarding = (orgId: string) => canDo(orgId, "canManageOnboarding");
export const canManagePerformance = (orgId: string) => canDo(orgId, "canManagePerformance");
export const canViewAnalytics = (orgId: string) => canDo(orgId, "canViewAnalytics");
export const canManageSettings = (orgId: string) => canDo(orgId, "canManageSettings");
export const canExecuteRestrictedActions = (orgId: string) =>
  canDo(orgId, "canExecuteRestrictedActions");
