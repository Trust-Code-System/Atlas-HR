"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type ExitActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function initiateExit(
  _prev: ExitActionResult,
  formData: FormData,
): Promise<ExitActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const employee_id = formData.get("employee_id") as string;
  if (!employee_id) return { error: "Employee is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("exit_records")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      reason: ((formData.get("reason") as string) || "resignation") as
        | "resignation" | "termination" | "redundancy" | "retirement" | "contract_end" | "other",
      status: "initiated",
      last_working_day: (formData.get("last_working_day") as string) || null,
      exit_date: (formData.get("exit_date") as string) || null,
      initiated_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to initiate exit." };

  // Seed default checklist items
  const defaults = [
    { category: "equipment", title: "Return laptop / desktop" },
    { category: "equipment", title: "Return access cards & keys" },
    { category: "equipment", title: "Return mobile devices" },
    { category: "access",    title: "Revoke email access" },
    { category: "access",    title: "Revoke system / software access" },
    { category: "access",    title: "Remove from Slack / Teams" },
    { category: "documentation", title: "Complete exit interview" },
    { category: "documentation", title: "Sign NDA / non-compete confirmation" },
    { category: "documentation", title: "Handover documentation" },
    { category: "finance",   title: "Process final payroll" },
    { category: "finance",   title: "Settle expense claims" },
  ] as const;

  await supabase.from("exit_checklist_items").insert(
    defaults.map((d) => ({
      org_id: orgCtx.org.id,
      exit_id: data.id,
      category: d.category,
      title: d.title,
      status: "pending" as const,
    })),
  );

  revalidatePath("/exit");
  return { success: true, id: data.id };
}

export async function updateExitRecord(
  _prev: ExitActionResult,
  formData: FormData,
): Promise<ExitActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const exitId = formData.get("exit_id") as string;
  if (!exitId) return { error: "Exit record ID required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exit_records")
    .update({
      reason: ((formData.get("reason") as string) || "resignation") as
        | "resignation" | "termination" | "redundancy" | "retirement" | "contract_end" | "other",
      status: ((formData.get("status") as string) || "initiated") as
        | "initiated" | "in_progress" | "completed",
      last_working_day: (formData.get("last_working_day") as string) || null,
      exit_date: (formData.get("exit_date") as string) || null,
      exit_interview_date: (formData.get("exit_interview_date") as string) || null,
      exit_interview_notes: (formData.get("exit_interview_notes") as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exitId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/exit");
  return { success: true };
}

export async function updateChecklistItem(
  itemId: string,
  status: "pending" | "in_progress" | "completed" | "not_applicable",
  notes?: string,
): Promise<ExitActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("exit_checklist_items")
    .update({
      status,
      notes: notes ?? null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      completed_by: status === "completed" ? (user?.id ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/exit");
  return { success: true };
}

export async function addChecklistItem(
  _prev: ExitActionResult,
  formData: FormData,
): Promise<ExitActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const exit_id = formData.get("exit_id") as string;
  const title = (formData.get("title") as string)?.trim();
  if (!exit_id || !title) return { error: "Exit ID and title are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("exit_checklist_items").insert({
    org_id: orgCtx.org.id,
    exit_id,
    category: ((formData.get("category") as string) || "other") as
      | "equipment" | "access" | "documentation" | "finance" | "other",
    title,
    description: (formData.get("description") as string)?.trim() || null,
    due_date: (formData.get("due_date") as string) || null,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/exit");
  return { success: true };
}

export async function deleteExit(exitId: string): Promise<ExitActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("exit_records")
    .delete()
    .eq("id", exitId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/exit");
  return { success: true };
}
