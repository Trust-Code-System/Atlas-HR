import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend } from "./client";

export type EmailType =
  | "welcome"
  | "verify_email"
  | "password_reset"
  | "magic_link"
  | "email_change"
  | "new_sign_in"
  | "reply_notification"
  | "mention_notification"
  | "org_invite"
  | "invite_accepted"
  | "weekly_digest"
  | "trial_ending"
  | "trial_ended"
  | "payment_failed"
  | "payment_receipt"
  | "subscription_canceled"
  | "subscription_upgraded"
  | "subscription_reactivated"
  | "team_pricing_migration"
  | "support_ticket_confirmation"
  | "support_ticket_alert"
  | "demo_request_confirmation"
  | "demo_request_alert"
  | "scheduled_report"
  | "beta_invite"
  | "workflow_escalation";

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T | null; error: DbError | null }>;
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  single(): QueryResult<T>;
  insert(values: Record<string, unknown>): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
};
type UntypedSupabase = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

type ProfilePrefs = {
  notification_preferences: unknown;
};

type EmailLogRow = {
  id: string;
};

function preferenceAllowsEmail(prefs: unknown, type: EmailType) {
  if (!prefs || typeof prefs !== "object") return true;
  const emailPrefs = (prefs as { email?: Record<string, unknown> }).email;
  const aliases: Partial<Record<EmailType, string>> = {
    reply_notification: "replies",
    mention_notification: "mentions",
    org_invite: "org_invites",
    invite_accepted: "org_activity",
  };
  const prefKey = aliases[type] ?? type;
  if (emailPrefs?.[prefKey] === false) return false;
  return emailPrefs?.[type] !== false;
}

function shouldCheckPreferences(type: EmailType, isMarketing?: boolean) {
  if (isMarketing) return true;
  return [
    "reply_notification",
    "mention_notification",
    "org_invite",
    "invite_accepted",
    "weekly_digest",
  ].includes(type);
}

export async function sendEmail(args: {
  to: string;
  type: EmailType;
  subject: string;
  react: ReactElement;
  userId?: string;
  preheader?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  isMarketing?: boolean;
  tags?: { name: string; value: string }[];
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}) {
  const supabase = createAdminClient() as unknown as UntypedSupabase;

  if (args.userId && shouldCheckPreferences(args.type, args.isMarketing)) {
    const { data: profile } = await supabase
      .from<ProfilePrefs>("profiles")
      .select("notification_preferences")
      .eq("id", args.userId)
      .single();

    if (!preferenceAllowsEmail(profile?.notification_preferences, args.type)) {
      console.log(`Email skipped by user preferences: ${args.type} to ${args.to}`);
      return { skipped: true as const };
    }
  }

  const html = await render(args.react);
  const text = await render(args.react, { plainText: true });
  const resend = getResend();

  const { data: logRow } = await supabase
    .from<EmailLogRow>("emails_sent")
    .insert({
      user_id: args.userId ?? null,
      type: args.type,
      recipient: args.to,
      subject: args.subject,
      status: "sending",
    })
    .select("id")
    .single();

  const headers: Record<string, string> = {};
  if (args.unsubscribeUrl) {
    headers["List-Unsubscribe"] =
      `<${args.unsubscribeUrl}>, <mailto:unsubscribe@atlashr.com?subject=Unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: args.to,
        replyTo: args.replyTo ?? process.env.RESEND_REPLY_TO,
        subject: args.subject,
        html,
        text,
        headers,
        tags: args.tags,
        attachments: args.attachments,
      });

      if (result.error) throw new Error(result.error.message);

      if (logRow) {
        await supabase
          .from("emails_sent")
          .update({
            status: "sent",
            resend_id: result.data?.id,
            sent_at: new Date().toISOString(),
          })
          .eq("id", logRow.id);
      }

      return { ok: true as const, id: result.data?.id };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  const message = lastErr instanceof Error ? lastErr.message : "Unknown email error";
  if (logRow) {
    await supabase
      .from("emails_sent")
      .update({ status: "failed", error: message })
      .eq("id", logRow.id);
  }
  throw lastErr;
}
