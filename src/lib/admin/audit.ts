import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type LogAdminActionInput = {
  adminUserId: string;
  action: string;
  targetUserId?: string | null;
  targetResource?: string | null;
  targetResourceId?: string | null;
  beforeValue?: Json;
  afterValue?: Json;
  reason?: string | null;
};

export async function logAdminAction(input: LogAdminActionInput) {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent");

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    target_resource: input.targetResource ?? null,
    target_resource_id: input.targetResourceId ?? null,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    reason: input.reason ?? null,
    ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("Failed to write admin audit log", error.message);
  }
}
