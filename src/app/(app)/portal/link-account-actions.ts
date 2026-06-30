"use server";

import { getActualUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { legacyRoleForRoles } from "@/lib/auth/permissions-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type LinkAccountState = { error?: string } | null;

const PORTAL_PATHS = [
  "/portal",
  "/portal/profile",
  "/portal/leave",
  "/portal/documents",
  "/portal/payslips",
  "/portal/benefits",
  "/portal/onboarding",
];

function revalidatePortal() {
  for (const path of PORTAL_PATHS) revalidatePath(path);
  revalidatePath("/org/people");
  revalidatePath("/dashboard");
}

export async function linkMyEmployeeAccount(
  _state: LinkAccountState,
): Promise<LinkAccountState> {
  void _state;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in again before linking your employee profile." };

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "No workspace was found for this account." };
  if (!orgCtx.isAdmin) return { error: "Only workspace admins can create their own employee profile." };

  const profile = await getActualUser();
  const email = user.email ?? profile?.email ?? null;
  const admin = createAdminClient();

  const expectedOrgRole = legacyRoleForRoles(orgCtx.roles);
  if (orgCtx.membership.org_role !== expectedOrgRole) {
    await admin
      .from("org_members")
      .update({ org_role: expectedOrgRole })
      .eq("id", orgCtx.membership.id)
      .eq("org_id", orgCtx.org.id)
      .eq("user_id", user.id);
  }

  const { data: alreadyLinked } = await admin
    .from("employees")
    .select("id")
    .eq("org_id", orgCtx.org.id)
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (alreadyLinked) {
    revalidatePortal();
    redirect("/portal");
  }

  if (email) {
    const { data: matchingEmployee } = await admin
      .from("employees")
      .select("id, linked_user_id")
      .eq("org_id", orgCtx.org.id)
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (matchingEmployee) {
      if (matchingEmployee.linked_user_id && matchingEmployee.linked_user_id !== user.id) {
        return { error: "An employee record with this email is already linked to another user." };
      }

      const { error } = await admin
        .from("employees")
        .update({ linked_user_id: user.id })
        .eq("id", matchingEmployee.id)
        .eq("org_id", orgCtx.org.id);

      if (error) return { error: error.message };

      revalidatePortal();
      redirect("/portal");
    }
  }

  const fallbackName = email?.split("@")[0] ?? "Workspace admin";
  const { error } = await admin.from("employees").insert({
    org_id: orgCtx.org.id,
    full_name: profile?.full_name ?? fallbackName,
    email,
    job_title: profile?.job_title ?? "Workspace admin",
    status: "active",
    linked_user_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePortal();
  redirect("/portal");
}
