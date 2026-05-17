"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type DisciplinaryActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function createCase(
  _prev: DisciplinaryActionResult,
  formData: FormData,
): Promise<DisciplinaryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const title = (formData.get("title") as string)?.trim();
  const incident_date = formData.get("incident_date") as string;
  const employee_id = formData.get("employee_id") as string;
  if (!title || !incident_date || !employee_id) return { error: "Title, employee and incident date are required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("disciplinary_cases")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      type: ((formData.get("type") as string) || "warning") as "query" | "warning" | "suspension" | "termination" | "other",
      severity: ((formData.get("severity") as string) || "minor") as "minor" | "moderate" | "serious" | "gross_misconduct",
      title,
      description: (formData.get("description") as string)?.trim() || null,
      incident_date,
      status: "open",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create case." };
  revalidatePath("/disciplinary");
  return { success: true, id: data.id };
}

export async function updateCaseStatus(
  caseId: string,
  status: "open" | "under_review" | "resolved" | "closed",
  outcome?: string,
): Promise<DisciplinaryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("disciplinary_cases")
    .update({
      status,
      outcome: outcome ?? null,
      resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/disciplinary");
  return { success: true };
}

export async function resolveCase(
  _prev: DisciplinaryActionResult,
  formData: FormData,
): Promise<DisciplinaryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const caseId = formData.get("case_id") as string;
  const outcome = (formData.get("outcome") as string)?.trim() || null;
  const status = (formData.get("status") as "resolved" | "closed") ?? "resolved";

  const supabase = await createClient();
  const { error } = await supabase
    .from("disciplinary_cases")
    .update({
      status,
      outcome,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/disciplinary");
  return { success: true };
}

export async function deleteCase(caseId: string): Promise<DisciplinaryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("disciplinary_cases")
    .delete()
    .eq("id", caseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/disciplinary");
  return { success: true };
}
