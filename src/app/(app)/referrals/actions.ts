"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type ReferralActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function submitReferral(
  _prev: ReferralActionResult,
  formData: FormData,
): Promise<ReferralActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const job_id = formData.get("job_id") as string;
  const referrer_id = formData.get("referrer_id") as string;
  const candidate_name = (formData.get("candidate_name") as string)?.trim();
  const candidate_email = (formData.get("candidate_email") as string)?.trim();

  if (!job_id || !referrer_id || !candidate_name || !candidate_email) {
    return { error: "Job, referrer, candidate name and email are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_referrals")
    .insert({
      org_id: orgCtx.org.id,
      job_id,
      referrer_id,
      candidate_name,
      candidate_email,
      candidate_phone: (formData.get("candidate_phone") as string)?.trim() || null,
      linkedin_url: (formData.get("linkedin_url") as string)?.trim() || null,
      relationship: (formData.get("relationship") as string)?.trim() || null,
      cover_note: (formData.get("cover_note") as string)?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to submit referral." };
  revalidatePath("/referrals");
  return { success: true, id: data.id };
}

export async function updateReferralStatus(
  referralId: string,
  status: "pending" | "reviewing" | "interviewing" | "hired" | "rejected",
  rejection_reason?: string,
): Promise<ReferralActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_referrals")
    .update({
      status,
      rejection_reason: status === "rejected" ? (rejection_reason ?? null) : null,
      hired_at: status === "hired" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/referrals");
  return { success: true };
}

export async function deleteReferral(referralId: string): Promise<ReferralActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_referrals")
    .delete()
    .eq("id", referralId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/referrals");
  return { success: true };
}
