import { createAdminClient } from "@/lib/supabase/admin";

export type BetaFeedbackCategory =
  | "bug"
  | "feature_request"
  | "content"
  | "general"
  | "onboarding"
  | "copilot"
  | "tools";

export type BetaFeedbackSeverity = "low" | "normal" | "high" | "blocker";
export type BetaFeedbackStatus = "new" | "reviewing" | "planned" | "in_progress" | "done" | "wontfix";

type BetaInviteRow = {
  id: string;
  code: string;
  email: string | null;
  cohort: string;
  is_vip: boolean | null;
  expires_at: string;
  access_expires_at: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
};

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T | null; error: DbError | null }>;
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  gt(column: string, value: unknown): QueryBuilder<T>;
  is(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: Record<string, unknown>): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  maybeSingle(): QueryResult<T>;
  single(): QueryResult<T>;
  insert(values: unknown): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
};
type AdminDb = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

function adminDb() {
  return createAdminClient() as unknown as AdminDb;
}

export function isBetaSignupRequired() {
  return (
    process.env.BETA_SIGNUP_REQUIRED === "true" ||
    process.env.NEXT_PUBLIC_BETA_SIGNUP_REQUIRED === "true"
  );
}

export function normalizeBetaCode(code: string | null | undefined) {
  return code?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
}

export function makeBetaCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const token = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `BETA-${token}`;
}

function accessExpiry() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
}

function emailMatches(inviteEmail: string | null, userEmail: string) {
  return !inviteEmail || inviteEmail.toLowerCase() === userEmail.toLowerCase();
}

export async function getValidInviteForCode(code: string) {
  const normalized = normalizeBetaCode(code);
  if (!normalized) return null;

  const { data, error } = await adminDb()
    .from<BetaInviteRow>("beta_invites")
    .select("id, code, email, cohort, is_vip, expires_at, access_expires_at, used_by, used_at, created_at")
    .eq("code", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data;
}

export async function applyBetaInviteToUser(args: {
  code?: string | null;
  userId: string;
  email: string;
}) {
  const normalized = normalizeBetaCode(args.code);
  if (!normalized) {
    if (isBetaSignupRequired()) {
      return { ok: false as const, error: "A valid beta invite code is required." };
    }
    return { ok: true as const, applied: false as const };
  }

  const invite = await getValidInviteForCode(normalized);
  if (!invite) return { ok: false as const, error: "That beta invite code was not found." };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false as const, error: "That beta invite code has expired." };
  }
  if (invite.used_by && invite.used_by !== args.userId) {
    return { ok: false as const, error: "That beta invite code has already been used." };
  }
  if (!emailMatches(invite.email, args.email)) {
    return { ok: false as const, error: "That beta invite code is assigned to a different email." };
  }

  const db = adminDb();
  const grantEndsAt = invite.access_expires_at ?? accessExpiry();

  let updateInvite = db
    .from("beta_invites")
    .update({
      used_by: args.userId,
      used_at: invite.used_at ?? new Date().toISOString(),
      access_expires_at: grantEndsAt,
    })
    .eq("id", invite.id);

  updateInvite = invite.used_by
    ? updateInvite.eq("used_by", invite.used_by)
    : updateInvite.is("used_by", null);

  const { error: inviteError } = await updateInvite.select("id").maybeSingle();

  if (inviteError) return { ok: false as const, error: inviteError.message };

  const { error: profileError } = await db
    .from("profiles")
    .update({ role: "pro" })
    .eq("id", args.userId)
    .select("id")
    .maybeSingle();

  if (profileError) return { ok: false as const, error: profileError.message };

  return {
    ok: true as const,
    applied: true as const,
    cohort: invite.cohort,
    accessExpiresAt: grantEndsAt,
  };
}

export async function userHasActiveBetaAccess(userId: string) {
  const { data } = await adminDb()
    .from<{ id: string }>("beta_invites")
    .select("id")
    .eq("used_by", userId)
    .gt("access_expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}
