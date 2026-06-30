"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type PayrollActionResult = { error?: string; success?: boolean; id?: string } | null;

function revalidatePayrollViews(runId?: string) {
  revalidatePath("/payroll");
  if (runId) revalidatePath(`/payroll/${runId}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createPayrollRun(
  _prev: PayrollActionResult,
  formData: FormData
): Promise<PayrollActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = formData.get("name") as string;
  const pay_period_start = formData.get("pay_period_start") as string;
  const pay_period_end = formData.get("pay_period_end") as string;
  const currency = (formData.get("currency") as string) || "GBP";
  const notes = (formData.get("notes") as string) || null;

  if (!name?.trim()) return { error: "Name is required." };
  if (!pay_period_start || !pay_period_end) return { error: "Pay period dates are required." };
  if (new Date(pay_period_start) > new Date(pay_period_end))
    return { error: "Start date must be before end date." };

  const supabase = await createClient();

  const { data: run, error: runErr } = await supabase
    .from("payroll_runs")
    .insert({
      org_id: orgCtx.org.id,
      name: name.trim(),
      pay_period_start,
      pay_period_end,
      currency,
      notes: notes?.trim() || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (runErr || !run) return { error: runErr?.message ?? "Failed to create payroll run." };

  // Auto-populate entries from active employees with salaries
  const { data: employees } = await supabase
    .from("employees")
    .select("id, salary, salary_currency")
    .eq("org_id", orgCtx.org.id)
    .eq("status", "active")
    .not("salary", "is", null);

  if (employees && employees.length > 0) {
    const entries = employees.map((e) => {
      const gross = e.salary ?? 0;
      // Simple deduction: 20% tax + 12% NI = 32% for demonstration
      const deductions = Math.round(gross * 0.32 * 100) / 100;
      const net = Math.round((gross - deductions) * 100) / 100;
      return {
        run_id: run.id,
        employee_id: e.id,
        gross_pay: gross,
        deductions,
        net_pay: net,
      };
    });

    await supabase.from("payroll_entries").insert(entries);

    // Update run totals
    const total_gross = entries.reduce((s, e) => s + e.gross_pay, 0);
    const total_net = entries.reduce((s, e) => s + e.net_pay, 0);
    await supabase
      .from("payroll_runs")
      .update({ total_gross, total_net })
      .eq("id", run.id);
  }

  revalidatePayrollViews(run.id);
  return { success: true, id: run.id };
}

export async function approvePayrollRun(runId: string): Promise<PayrollActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("payroll_runs")
    .select("id, status")
    .eq("id", runId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!run) return { error: "Payroll run not found." };
  if (run.status !== "draft") return { error: "Only draft runs can be approved." };

  const { error } = await supabase
    .from("payroll_runs")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) return { error: error.message };

  revalidatePayrollViews(runId);
  return { success: true };
}

export async function markPayrollRunPaid(runId: string): Promise<PayrollActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("payroll_runs")
    .select("id, status")
    .eq("id", runId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!run) return { error: "Payroll run not found." };
  if (run.status !== "approved") return { error: "Only approved runs can be marked as paid." };

  const { error } = await supabase
    .from("payroll_runs")
    .update({
      status: "paid",
      run_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) return { error: error.message };

  revalidatePayrollViews(runId);
  return { success: true };
}
