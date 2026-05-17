"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";
import { getTimeEmployeeForUser } from "./employee-lookup";

export type TimeActionResult = { error?: string; success?: boolean } | null;

export async function logHours(
  _prev: TimeActionResult,
  formData: FormData
): Promise<TimeActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const employee = await getTimeEmployeeForUser(supabase, orgCtx, user);

  if (!employee) return { error: "Employee record not found." };

  const date = formData.get("date") as string;
  const hours = parseFloat(formData.get("hours") as string);
  const category = (formData.get("category") as string) || "regular";
  const notes = (formData.get("notes") as string) || null;

  if (!date) return { error: "Date is required." };
  if (isNaN(hours) || hours <= 0 || hours > 24) return { error: "Hours must be between 0 and 24." };

  const { error } = await supabase
    .from("time_entries")
    .upsert(
      {
        org_id: orgCtx.org.id,
        employee_id: employee.id,
        date,
        hours,
        category: category as "regular" | "overtime" | "sick" | "holiday" | "training",
        notes: notes?.trim() || null,
        status: "draft",
      },
      { onConflict: "employee_id,date,category" }
    );

  if (error) return { error: error.message };

  revalidatePath("/time");
  return { success: true };
}

export async function submitWeek(weekStart: string): Promise<TimeActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const employee = await getTimeEmployeeForUser(supabase, orgCtx, user);

  if (!employee) return { error: "Employee record not found." };

  // Calculate week end
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endStr = end.toISOString().split("T")[0];

  const { error } = await supabase
    .from("time_entries")
    .update({ status: "submitted" })
    .eq("employee_id", employee.id)
    .eq("status", "draft")
    .gte("date", weekStart)
    .lte("date", endStr);

  if (error) return { error: error.message };

  revalidatePath("/time");
  return { success: true };
}

export async function approveEntry(entryId: string): Promise<TimeActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  // Verify via employee → org
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, employee_id")
    .eq("id", entryId)
    .single();

  if (!entry) return { error: "Entry not found." };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", entry.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return { error: "Not authorised." };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("time_entries")
    .update({ status: "approved", approved_by: user?.id ?? null })
    .eq("id", entryId);

  if (error) return { error: error.message };

  revalidatePath("/time");
  return { success: true };
}
