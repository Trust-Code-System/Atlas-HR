"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type TravelActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function submitTravelRequest(
  _prev: TravelActionResult,
  formData: FormData,
): Promise<TravelActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Organisation not found." };

  const employee_id = formData.get("employee_id") as string;
  const purpose = (formData.get("purpose") as string)?.trim();
  const origin = (formData.get("origin") as string)?.trim();
  const destination = (formData.get("destination") as string)?.trim();
  const departure_date = formData.get("departure_date") as string;
  const return_date = formData.get("return_date") as string;
  const currency = (formData.get("currency") as string) || "USD";
  const estimated_budget_raw = formData.get("estimated_budget") as string;
  const estimated_budget_parsed = estimated_budget_raw ? parseFloat(estimated_budget_raw) : null;
  const estimated_budget = estimated_budget_parsed != null && isFinite(estimated_budget_parsed)
    ? Math.max(0, Math.min(estimated_budget_parsed, 1_000_000))
    : null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!employee_id || !purpose || !origin || !destination || !departure_date || !return_date) {
    return { error: "Employee, purpose, origin, destination and travel dates are required." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("travel_requests")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      submitted_by: user?.id ?? null,
      purpose,
      origin,
      destination,
      departure_date,
      return_date,
      currency,
      estimated_budget,
      notes,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to submit travel request." };
  revalidatePath("/travel");
  return { success: true, id: data.id };
}

export async function updateTravelStatus(
  requestId: string,
  status: "approved" | "rejected" | "cancelled" | "completed",
  notes?: string,
): Promise<TravelActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) update.notes = notes || null;

  if (status === "approved" || status === "rejected") {
    update.approved_by = user?.id ?? null;
    update.approved_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("travel_requests")
    .update(update)
    .eq("id", requestId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/travel");
  return { success: true };
}

export async function attachBookingDetails(
  _prev: TravelActionResult,
  formData: FormData,
): Promise<TravelActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const requestId = formData.get("request_id") as string;
  if (!requestId) return { error: "Request ID is required." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("travel_requests")
    .update({
      airline:            (formData.get("airline") as string)?.trim() || null,
      flight_number:      (formData.get("flight_number") as string)?.trim() || null,
      hotel_name:         (formData.get("hotel_name") as string)?.trim() || null,
      hotel_confirmation: (formData.get("hotel_confirmation") as string)?.trim() || null,
      check_in:           (formData.get("check_in") as string) || null,
      check_out:          (formData.get("check_out") as string) || null,
      per_diem_rate:      formData.get("per_diem_rate") ? Math.max(0, Math.min(parseFloat(formData.get("per_diem_rate") as string), 10_000)) : null,
      actual_cost:        formData.get("actual_cost") ? Math.max(0, Math.min(parseFloat(formData.get("actual_cost") as string), 1_000_000)) : null,
      booking_notes:      (formData.get("booking_notes") as string)?.trim() || null,
      updated_at:         new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/travel");
  return { success: true };
}

export async function deleteTravelRequest(requestId: string): Promise<TravelActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("travel_requests")
    .delete()
    .eq("id", requestId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/travel");
  return { success: true };
}
