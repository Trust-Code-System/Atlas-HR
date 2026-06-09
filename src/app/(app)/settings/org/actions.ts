"use server";

import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { normalizeRoles, legacyRoleForRoles, WORKSPACE_ROLES } from "@/lib/auth/permissions-shared";
import { sendEmail } from "@/lib/email/send";
import { Invite } from "@/emails/org/Invite";
import { revalidatePath } from "next/cache";

export type OrgSettingsResult = { error?: string; success?: boolean } | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function inviteMember(
  _prev: OrgSettingsResult,
  formData: FormData
): Promise<OrgSettingsResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const requestedRole = (formData.get("role") as string) ?? "employee";
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const roles = normalizeRoles([
    WORKSPACE_ROLES.includes(requestedRole as never) ? requestedRole : "employee",
  ]);
  const orgRole = legacyRoleForRoles(roles);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  // Already a member of this org?
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingProfile) {
    const { data: existingMember } = await admin
      .from("org_members")
      .select("id")
      .eq("org_id", orgCtx.org.id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();
    if (existingMember) return { error: "That person is already a member of this workspace." };
  }

  // Replace any prior un-accepted invite for this email so the latest link wins.
  await admin
    .from("org_invites")
    .delete()
    .eq("org_id", orgCtx.org.id)
    .eq("email", email)
    .is("accepted_at", null);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from("org_invites").insert({
    org_id: orgCtx.org.id,
    email,
    org_role: orgRole,
    roles,
    token,
    invited_by: user?.id ?? null,
    expires_at: expiresAt,
  });
  if (insertError) return { error: insertError.message };

  const { data: inviter } = user
    ? await admin.from("profiles").select("full_name, email").eq("id", user.id).single()
    : { data: null };

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invites/${token}`;

  try {
    await sendEmail({
      to: email,
      type: "org_invite",
      subject: `You're invited to join ${orgCtx.org.name} on Atlas HR`,
      react: createElement(Invite, {
        inviterName: inviter?.full_name ?? inviter?.email ?? "Your HR team",
        inviterEmail: inviter?.email ?? "",
        orgName: orgCtx.org.name,
        industry: orgCtx.org.industry,
        inviteUrl,
      }),
    });
  } catch {
    // Invite row is saved; surface a soft warning if the email failed to send.
    return { error: "Invite created, but the email could not be sent. Share the link manually." };
  }

  revalidatePath("/settings/team");
  return { success: true };
}

export async function updateOrgSettings(
  _prev: OrgSettingsResult,
  formData: FormData
): Promise<OrgSettingsResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = formData.get("name") as string;
  const industry = (formData.get("industry") as string) || null;
  const country = (formData.get("country") as string) || null;
  const size = (formData.get("size") as string) || null;

  if (!name?.trim()) return { error: "Organisation name is required." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("organisations")
    .update({
      name: name.trim(),
      industry: industry || null,
      country: country || null,
      size: size || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgCtx.org.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/org");
  return { success: true };
}

export async function updateMemberRole(
  memberId: string,
  role: "admin" | "member"
): Promise<OrgSettingsResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Prevent self-demotion if only admin
  const { data: member } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("id", memberId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!member) return { error: "Member not found." };
  if (member.user_id === user?.id && role === "member") {
    const { count } = await supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgCtx.org.id)
      .eq("org_role", "admin");
    if ((count ?? 0) <= 1) return { error: "Cannot remove the last admin." };
  }

  const { error } = await supabase
    .from("org_members")
    .update({ org_role: role })
    .eq("id", memberId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}
