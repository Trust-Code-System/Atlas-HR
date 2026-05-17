"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type BenefitsActionResult = { error?: string; success?: boolean; id?: string } | null;

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function createPlan(
  _prev: BenefitsActionResult,
  formData: FormData,
): Promise<BenefitsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Plan name is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rawEmp = parseFloat(formData.get("employer_contribution") as string);
  const rawEe  = parseFloat(formData.get("employee_contribution") as string);
  const employer = isFinite(rawEmp) ? Math.max(0, Math.min(rawEmp, 100)) : 0;
  const employee = isFinite(rawEe)  ? Math.max(0, Math.min(rawEe,  100)) : 0;
  const renewal = (formData.get("renewal_date") as string) || null;

  const { data, error } = await supabase
    .from("benefit_plans")
    .insert({
      org_id: orgCtx.org.id,
      name,
      type: ((formData.get("type") as string) || "other") as "health" | "dental" | "vision" | "pension" | "life" | "other",
      provider: (formData.get("provider") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
      employer_contribution: employer,
      employee_contribution: employee,
      currency: (formData.get("currency") as string) || "GBP",
      status: ((formData.get("status") as string) || "active") as "active" | "inactive" | "archived",
      renewal_date: renewal || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create plan." };

  revalidatePath("/benefits");
  return { success: true, id: data.id };
}

export async function updatePlanStatus(
  planId: string,
  status: "active" | "inactive" | "archived",
): Promise<BenefitsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefit_plans")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/benefits");
  return { success: true };
}

export async function deletePlan(planId: string): Promise<BenefitsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefit_plans")
    .delete()
    .eq("id", planId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/benefits");
  return { success: true };
}

// ─── Enrolments ───────────────────────────────────────────────────────────────

export async function enrolEmployee(
  _prev: BenefitsActionResult,
  formData: FormData,
): Promise<BenefitsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const planId = formData.get("plan_id") as string;
  const employeeId = formData.get("employee_id") as string;
  if (!planId || !employeeId) return { error: "Plan and employee are required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("benefit_enrolments")
    .upsert(
      {
        org_id: orgCtx.org.id,
        plan_id: planId,
        employee_id: employeeId,
        status: "active",
        start_date: (formData.get("start_date") as string) || null,
        notes: (formData.get("notes") as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "plan_id,employee_id" },
    )
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to enrol employee." };
  revalidatePath("/benefits");
  return { success: true, id: data.id };
}

export async function updateEnrolmentStatus(
  enrolmentId: string,
  status: "active" | "pending" | "opted_out" | "terminated",
): Promise<BenefitsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("benefit_enrolments")
    .update({
      status,
      end_date: status === "terminated" ? new Date().toISOString().split("T")[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrolmentId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/benefits");
  return { success: true };
}
