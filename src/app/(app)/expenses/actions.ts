"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type ExpenseActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function submitExpense(
  _prev: ExpenseActionResult,
  formData: FormData,
): Promise<ExpenseActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Organisation not found." };

  const employee_id = formData.get("employee_id") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string)?.trim();
  const rawAmount = parseFloat(formData.get("amount") as string);
  const amount = isFinite(rawAmount) ? Math.max(0, Math.min(rawAmount, 1_000_000)) : NaN;
  const currency = (formData.get("currency") as string) || "USD";
  const merchant = (formData.get("merchant") as string)?.trim() || null;
  const expense_date = formData.get("expense_date") as string;
  const receipt_url = (formData.get("receipt_url") as string)?.trim() || null;

  if (!employee_id || !category || !description || isNaN(amount) || !expense_date) {
    return { error: "Employee, category, description, amount and date are required." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("expenses")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      submitted_by: user?.id ?? null,
      category,
      description,
      amount,
      currency,
      merchant,
      expense_date,
      receipt_url,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to submit expense." };
  revalidatePath("/expenses");
  return { success: true, id: data.id };
}

export async function updateExpenseStatus(
  expenseId: string,
  status: "approved" | "rejected" | "reimbursed",
  notes?: string,
): Promise<ExpenseActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const update: Record<string, unknown> = {
    status,
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved" || status === "rejected") {
    update.approved_by = user?.id ?? null;
    update.approved_at = new Date().toISOString();
  }
  if (status === "reimbursed") {
    update.reimbursed_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("expenses")
    .update(update)
    .eq("id", expenseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpense(expenseId: string): Promise<ExpenseActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  return { success: true };
}
