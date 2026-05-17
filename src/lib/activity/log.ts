import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type ResourceType =
  | "employee"
  | "document"
  | "leave_request"
  | "approval"
  | "workflow"
  | "policy"
  | "lifecycle"
  | "task"
  | "workspace"
  | "role"
  | "profile_change";

export type ActionType =
  | "created"
  | "updated"
  | "deleted"
  | "approved"
  | "rejected"
  | "signed"
  | "viewed"
  | "downloaded"
  | "shared"
  | "requested"
  | "completed"
  | "blocked"
  | "uploaded";

export type LogInput = {
  orgId: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceDisplayName?: string;
  action: ActionType;
  before?: unknown;
  after?: unknown;
  reason?: string;
  source?: "web" | "api" | "system" | "import" | "webhook";
};

export async function logActivity(input: LogInput) {
  const [supabase, headerStore] = await Promise.all([createClient(), headers()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: profile } = user
    ? await admin.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle()
    : { data: null };

  const changedFields = input.before && input.after ? diffKeys(input.before, input.after) : undefined;

  await admin.from("activity_log").insert({
    org_id: input.orgId,
    actor_user_id: user?.id ?? null,
    actor_email: profile?.email ?? user?.email ?? null,
    actor_display_name: profile?.full_name ?? null,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    resource_display_name: input.resourceDisplayName ?? null,
    action: input.action,
    before_value: toJson(input.before),
    after_value: toJson(input.after),
    changed_fields: changedFields,
    reason: input.reason ?? null,
    source: input.source ?? "web",
    ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    user_agent: headerStore.get("user-agent"),
    request_id: headerStore.get("x-request-id") ?? headerStore.get("x-vercel-id"),
  });
}

export async function withActivity<T>(
  context: Omit<LogInput, "before" | "after">,
  before: () => Promise<unknown>,
  mutation: () => Promise<T>,
  after?: () => Promise<unknown>
): Promise<T> {
  const beforeValue = await before();
  const result = await mutation();
  const afterValue = after ? await after() : await before();
  await logActivity({ ...context, before: beforeValue, after: afterValue });
  return result;
}

function diffKeys(before: unknown, after: unknown) {
  if (!isRecord(before) || !isRecord(after)) return undefined;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function toJson(value: unknown): Json | null {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value)) as Json;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
