import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { normalizeRoles, type WorkspaceRole } from "@/lib/auth/permissions";
import type { Organisation, OrgMember } from "@/types/database";

export type OrgContext = {
  org: Organisation;
  membership: OrgMember;
  isAdmin: boolean;
  roles: WorkspaceRole[];
};

// React.cache deduplicates calls within a single request — multiple server
// components calling getCurrentOrg() on the same page share one DB round-trip.
export const getCurrentOrg = cache(async (): Promise<OrgContext | null> => {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const savedOrgId = cookieStore.get("atlas-current-org")?.value;

  const { data: memberships } = await supabase
    .from("org_members")
    .select("*")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!memberships || memberships.length === 0) return null;

  const membership = savedOrgId
    ? memberships.find((m) => m.org_id === savedOrgId) ?? memberships[0]
    : memberships[0];

  const { data: org } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", membership.org_id)
    .single();

  if (!org) return null;

  return {
    org,
    membership: membership as OrgMember,
    roles: normalizeRoles(membership.roles),
    isAdmin:
      normalizeRoles(membership.roles).includes("workspace_owner") ||
      normalizeRoles(membership.roles).includes("hr_admin") ||
      normalizeRoles(membership.roles).includes("hr_manager"),
  };
});
