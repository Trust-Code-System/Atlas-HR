"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type OrgSettingsResult = { error?: string; success?: boolean } | null;

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
