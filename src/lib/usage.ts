import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLimits } from "@/lib/limits";
import type { UserRole } from "@/lib/limits";

export type UsagePeriod = "day" | "month";

export interface UsageResult {
  used: number;
  limit: number;
  allowed: boolean;
}

type ConsumeUsageClient = {
  rpc(
    fn: "consume_usage",
    args: {
      _user_id: string;
      _resource: string;
      _period: UsagePeriod;
      _limit: number;
    }
  ): Promise<{ data: Array<{ used: number; allowed: boolean }> | { used: number; allowed: boolean } | null; error: { message: string } | null }>;
};

function periodStart(period: UsagePeriod): string {
  const now = new Date();
  if (period === "day") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Atomically consume one unit of a resource and return whether the operation
 * was allowed. This is the ONLY safe way to enforce usage limits under
 * concurrent requests — it calls the consume_usage SQL function which holds
 * a Postgres advisory lock for the duration of the transaction.
 *
 * Do NOT split this into a separate check + record — that pattern has a race
 * condition where two simultaneous requests both pass the check before either
 * records, allowing free users to exceed their monthly cap.
 */
export async function consumeUsage(
  userId: string,
  role: UserRole,
  resource: keyof ReturnType<typeof getLimits>,
  period: UsagePeriod
): Promise<UsageResult> {
  // TEST_MODE: getLimits() already returns Infinity limits, so the isFinite
  // check below short-circuits and never hits the DB.
  const limits = getLimits(role);
  const limit = limits[resource] as number;

  // Unlimited roles skip the DB call entirely
  if (!isFinite(limit)) {
    return { used: 0, limit: Infinity, allowed: true };
  }

  const supabase = (await createClient()) as unknown as ConsumeUsageClient;
  const { data, error } = await supabase.rpc("consume_usage", {
    _user_id: userId,
    _resource: resource,
    _period: period,
    _limit: limit,
  });

  if (error) {
    // Fail closed: if we can't enforce the limit, block the request
    console.error("consume_usage RPC failed:", error.message);
    return { used: 0, limit, allowed: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    used: row?.used ?? 0,
    limit,
    allowed: row?.allowed ?? false,
  };
}

/**
 * Read-only usage check for UI display (sidebar meter, upgrade prompts).
 * Never use this to gate access — use consumeUsage for that.
 */
export async function checkUsage(
  userId: string,
  role: UserRole,
  resource: keyof ReturnType<typeof getLimits>,
  period: UsagePeriod
): Promise<UsageResult> {
  const limits = getLimits(role);
  const limit = limits[resource] as number;

  if (!isFinite(limit)) {
    return { used: 0, limit: Infinity, allowed: true };
  }

  const supabase = await createClient();
  const start = periodStart(period);

  const { data } = await supabase
    .from("usage_tracking")
    .select("count")
    .eq("user_id", userId)
    .eq("resource", resource)
    .gte("period_start", start);

  const used = (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
  return { used, limit, allowed: used < limit };
}

/**
 * @deprecated Use consumeUsage() instead. recordUsage() paired with a prior
 * checkUsage() has a race condition. Kept for any legacy callers that haven't
 * been migrated yet.
 */
export async function recordUsage(
  userId: string,
  resource: string,
  period: UsagePeriod,
  ref?: string
): Promise<void> {
  const supabase = await createClient();
  const start = periodStart(period);

  await supabase.from("usage_tracking").insert({
    user_id: userId,
    resource,
    resource_ref: ref ?? null,
    count: 1,
    period_start: start,
  });
}

export async function getUsageSummary(
  userId: string,
  role: UserRole
): Promise<{
  tool_generations: UsageResult;
  copilot_messages: UsageResult;
  saved_items_count: number;
  saved_items_limit: number;
}> {
  const supabase = await createClient();

  const [toolGen, copilotMsg, savedCount] = await Promise.all([
    checkUsage(userId, role, "tool_generations_per_month", "month"),
    checkUsage(userId, role, "copilot_messages_per_day", "day"),
    supabase
      .from("saved_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const limits = getLimits(role);

  return {
    tool_generations: toolGen,
    copilot_messages: copilotMsg,
    saved_items_count: savedCount.count ?? 0,
    saved_items_limit: limits.saved_items,
  };
}

/** Admin-side usage read for reporting (bypasses RLS). */
export async function getUsageAdmin(
  userId: string,
  resource: string,
  period: UsagePeriod
): Promise<number> {
  const supabase = createAdminClient();
  const start = periodStart(period);

  const { data } = await supabase
    .from("usage_tracking")
    .select("count")
    .eq("user_id", userId)
    .eq("resource", resource)
    .gte("period_start", start);

  return (data ?? []).reduce((sum, row) => sum + ((row as { count: number }).count ?? 0), 0);
}
