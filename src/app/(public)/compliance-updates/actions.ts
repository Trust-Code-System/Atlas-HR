"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export async function saveComplianceSubscriptions(
  jurisdictions: string[]
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Sign in to save subscriptions." };

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  const existing = (profile?.notification_preferences as Record<string, unknown>) ?? {};

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preferences: {
        ...existing,
        compliance_jurisdictions: jurisdictions,
      },
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/compliance-updates");
  return { success: true };
}
