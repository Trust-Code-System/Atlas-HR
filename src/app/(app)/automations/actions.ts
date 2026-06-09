"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type AutomationActionResult = { error?: string; success?: boolean; id?: string } | null;

const TRIGGERS = ["document_expiring", "contract_ending", "new_hire", "leave_pending"];
const ACTIONS = ["notify_hr", "notify_manager", "create_task"];

export interface NewAutomation {
  name: string;
  nl_prompt?: string | null;
  trigger_type: string;
  trigger_days: number;
  action_type: string;
  action_config?: { task_title?: string | null; message?: string | null };
}

export async function createAutomation(input: NewAutomation): Promise<AutomationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  if (!input.name?.trim()) return { error: "Give the workflow a name." };
  if (!TRIGGERS.includes(input.trigger_type)) return { error: "Unsupported trigger." };
  if (!ACTIONS.includes(input.action_type)) return { error: "Unsupported action." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("automation_workflows")
    .insert({
      org_id: orgCtx.org.id,
      name: input.name.trim().slice(0, 120),
      nl_prompt: input.nl_prompt?.trim() || null,
      trigger_type: input.trigger_type,
      trigger_days: Math.max(0, Math.min(365, Math.round(input.trigger_days ?? 30))),
      action_type: input.action_type,
      action_config: {
        task_title: input.action_config?.task_title?.trim() || null,
        message: input.action_config?.message?.trim() || null,
      },
      is_active: true,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to save workflow." };

  revalidatePath("/automations");
  return { success: true, id: data.id };
}

export async function setAutomationActive(id: string, active: boolean): Promise<AutomationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_workflows")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function deleteAutomation(id: string): Promise<AutomationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_workflows")
    .delete()
    .eq("id", id)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { success: true };
}
