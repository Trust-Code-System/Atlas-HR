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
