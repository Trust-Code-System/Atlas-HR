"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean } | null;

export async function submitLeaveRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const orgData = await getCurrentOrg();
  if (!orgData) return { error: "No organisation found" };

  const employee = await getMyEmployee();
  if (!employee) return { error: "Your account is not linked to an employee record" };

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const leaveType = formData.get("leave_type") as string;

  if (!startDate || !endDate) return { error: "Start and end dates are required" };
  if (endDate < startDate) return { error: "End date must be on or after start date" };
  if (!leaveType) return { error: "Please select a leave type" };

  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({
    employee_id: employee.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason: (formData.get("reason") as string) || null,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/portal/leave");
  revalidatePath("/portal");
  return { success: true };
}

export async function cancelLeaveRequest(requestId: string): Promise<ActionResult> {
  const employee = await getMyEmployee();
  if (!employee) return { error: "Account not linked" };

  const supabase = await createClient();

  // Verify the request belongs to this employee
  const { data: req } = await supabase
    .from("leave_requests")
    .select("id, status")
    .eq("id", requestId)
    .eq("employee_id", employee.id)
    .single();

  if (!req) return { error: "Leave request not found" };
  if (req.status !== "pending") return { error: "Only pending requests can be cancelled" };

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/portal/leave");
  revalidatePath("/portal");
  return { success: true };
}
