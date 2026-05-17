import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeRoles, type WorkspaceRole } from "@/lib/auth/permissions";
import type { Employee, Organisation, OrgMember, Profile } from "@/types/database";

export type EmployeePortalContext = {
  user: { id: string; email?: string | null };
  profile: Profile | null;
  employee: Employee;
  org: Organisation;
  membership: OrgMember | null;
  roles: WorkspaceRole[];
  isHr: boolean;
};

export async function getEmployeePortalContext(): Promise<EmployeePortalContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const employeeQuery = supabase
    .from("employees")
    .select("*")
    .or(`linked_user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: employees } = await employeeQuery;
  const employee = employees?.[0] ?? null;
  if (!employee) return null;

  const [{ data: org }, { data: membership }] = await Promise.all([
    supabase.from("organisations").select("*").eq("id", employee.org_id).maybeSingle(),
    supabase
      .from("org_members")
      .select("*")
      .eq("org_id", employee.org_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!org) return null;

  const roles = normalizeRoles(membership?.roles ?? ["employee"]);
  const isHr =
    roles.includes("workspace_owner") ||
    roles.includes("hr_admin") ||
    roles.includes("hr_manager");

  return {
    user: { id: user.id, email: user.email },
    profile: profile as Profile | null,
    employee: employee as Employee,
    org: org as Organisation,
    membership: membership as OrgMember | null,
    roles,
    isHr,
  };
}

export async function requireEmployeePortalContext(): Promise<EmployeePortalContext> {
  const ctx = await getEmployeePortalContext();
  if (!ctx) redirect("/dashboard");
  return ctx;
}
