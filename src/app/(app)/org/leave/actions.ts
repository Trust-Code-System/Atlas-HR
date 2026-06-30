"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean } | null;

function revalidateLeaveViews() {
  revalidatePath("/org/leave");
  revalidatePath("/portal/leave");
  revalidatePath("/portal");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/manager");
}

async function verifyLeaveRequestInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestId: string,
  orgId: string
): Promise<boolean> {
  const { data: req } = await supabase
    .from("leave_requests")
    .select("employee_id")
    .eq("id", requestId)
    .single();
  if (!req) return false;

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", req.employee_id)
    .eq("org_id", orgId)
    .single();
  return !!emp;
}

export async function approveLeaveRequest(requestId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData || !orgData.isAdmin) return { error: "Unauthorised" };

  const supabase = await createClient();

  const ok = await verifyLeaveRequestInOrg(supabase, requestId, orgData.org.id);
  if (!ok) return { error: "Leave request not found" };

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: "approved",
      approver_id: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidateLeaveViews();
  return { success: true };
}

export async function rejectLeaveRequest(requestId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData || !orgData.isAdmin) return { error: "Unauthorised" };

  const supabase = await createClient();

  const ok = await verifyLeaveRequestInOrg(supabase, requestId, orgData.org.id);
  if (!ok) return { error: "Leave request not found" };

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "rejected", approver_id: user.id })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidateLeaveViews();
  return { success: true };
}

export async function createLeaveRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData) return { error: "No organisation found" };

  const supabase = await createClient();
  const employeeId = formData.get("employee_id") as string;
  if (!employeeId) return { error: "Please select an employee" };

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", orgData.org.id)
    .single();

  if (!emp) return { error: "Employee not found" };

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  if (!startDate || !endDate) return { error: "Start and end dates are required" };
  if (endDate < startDate) return { error: "End date must be on or after start date" };

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: employeeId,
    leave_type: formData.get("leave_type") as string,
    start_date: startDate,
    end_date: endDate,
    reason: (formData.get("reason") as string) || null,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidateLeaveViews();
  return { success: true };
}
