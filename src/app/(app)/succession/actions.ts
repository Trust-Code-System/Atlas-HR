"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type SuccessionActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function addCandidate(
  _prev: SuccessionActionResult,
  formData: FormData,
): Promise<SuccessionActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const employee_id = formData.get("employee_id") as string;
  const target_role = (formData.get("target_role") as string)?.trim();
  if (!employee_id || !target_role) return { error: "Employee and target role are required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("succession_candidates")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      target_role,
      readiness: ((formData.get("readiness") as string) || "not_ready") as
        | "ready_now" | "ready_1_year" | "ready_2_plus" | "not_ready",
      potential: ((formData.get("potential") as string) || "medium") as
        | "high" | "medium" | "low",
      performance: ((formData.get("performance") as string) || "meets") as
        | "exceeds" | "meets" | "below",
      development_areas: (formData.get("development_areas") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      nominated_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to add candidate." };
  revalidatePath("/succession");
  return { success: true, id: data.id };
}

export async function updateCandidate(
  _prev: SuccessionActionResult,
  formData: FormData,
): Promise<SuccessionActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const candidateId = formData.get("candidate_id") as string;
  if (!candidateId) return { error: "Candidate ID required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("succession_candidates")
    .update({
      target_role: (formData.get("target_role") as string)?.trim(),
      readiness: ((formData.get("readiness") as string) || "not_ready") as
        | "ready_now" | "ready_1_year" | "ready_2_plus" | "not_ready",
      potential: ((formData.get("potential") as string) || "medium") as
        | "high" | "medium" | "low",
      performance: ((formData.get("performance") as string) || "meets") as
        | "exceeds" | "meets" | "below",
      development_areas: (formData.get("development_areas") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/succession");
  return { success: true };
}

export async function promoteCandidate(candidateId: string): Promise<SuccessionActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("succession_candidates")
    .update({
      status: "promoted",
      promoted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/succession");
  return { success: true };
}

export async function removeCandidate(candidateId: string): Promise<SuccessionActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("succession_candidates")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", candidateId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/succession");
  return { success: true };
}

export async function deleteCandidate(candidateId: string): Promise<SuccessionActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("succession_candidates")
    .delete()
    .eq("id", candidateId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/succession");
  return { success: true };
}
