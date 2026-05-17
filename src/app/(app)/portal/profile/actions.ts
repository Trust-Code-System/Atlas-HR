"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean } | null;

export async function updateMyProfile(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getMyEmployee();
  if (!employee) return { error: "Account not linked to an employee record" };

  const phone = (formData.get("phone") as string) || null;
  const address = (formData.get("address") as string) || null;
  const emergencyContactName = (formData.get("emergency_contact_name") as string) || null;
  const emergencyContactPhone = (formData.get("emergency_contact_phone") as string) || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      phone,
      address,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/portal/profile");
  return { success: true };
}
