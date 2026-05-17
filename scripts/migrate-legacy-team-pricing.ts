import { loadEnvConfig } from "@next/env";
import { createElement } from "react";

loadEnvConfig(process.cwd());

type LegacyCandidate = {
  id: string;
  stripe_subscription_id: string;
  org_id: string | null;
  quantity: number | null;
  billing_interval: "month" | "year";
};

type OwnerRow = {
  user_id: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
};

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T | null; error: DbError | null }>;
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: readonly string[]): QueryBuilder<T>;
  contains(column: string, values: readonly string[]): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  maybeSingle(): QueryResult<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  then<TResult1 = { data: T[] | null; error: DbError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: DbError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};
type UntypedSupabase = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

function currency(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

function legacyUntilDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const sendEmails = process.argv.includes("--email");
  const legacyUntil = process.env.LEGACY_TEAM_PRICING_UNTIL ?? legacyUntilDate();
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const { stripe } = await import("../src/lib/stripe/server");
  const { PLANS } = await import("../src/lib/stripe/products");
  const { sendEmail } = await import("../src/lib/email/send");
  const { TeamPricingMigration } = await import("../src/emails/billing/TeamPricingMigration");

  const supabase = createAdminClient() as unknown as UntypedSupabase;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, org_id, quantity, billing_interval")
    .eq("plan", "team")
    .in("status", ["trialing", "active", "past_due"])
    .eq("legacy_pricing", false);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as LegacyCandidate[];

  console.log(`${apply ? "Migrating" : "Dry run:"} ${rows.length} Team subscription(s). Legacy until ${legacyUntil}.`);

  for (const row of rows) {
    const employees = Math.max(row.quantity ?? 1, 1);
    const legacyMonthly = 49 + Math.max(0, employees - 5) * 5;
    const newMonthly = PLANS.team.priceMonthly + employees * PLANS.team.seatPriceMonthly;
    const summary = `${currency(legacyMonthly)}/mo legacy estimate -> ${currency(newMonthly)}/mo current Team estimate`;

    console.log(`${row.stripe_subscription_id}: ${summary}`);
    if (!apply) continue;

    await supabase
      .from("subscriptions")
      .update({
        legacy_pricing: true,
        legacy_until: legacyUntil,
        legacy_price_summary: summary,
      })
      .eq("id", row.id);

    await stripe.subscriptions.update(row.stripe_subscription_id, {
      metadata: {
        legacy_pricing: "true",
        legacy_until: legacyUntil,
        legacy_price_summary: summary,
      },
    });

    if (!sendEmails || !row.org_id) continue;

    const { data: owner } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", row.org_id)
      .contains("roles", ["workspace_owner"])
      .limit(1)
      .maybeSingle();

    const ownerRow = owner as OwnerRow | null;
    if (!ownerRow?.user_id) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", ownerRow.user_id)
      .maybeSingle();

    const profileRow = profile as ProfileRow | null;
    if (!profileRow?.email) continue;

    const firstName = (profileRow.full_name ?? profileRow.email).split(/\s+/)[0] || "there";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendEmail({
      to: profileRow.email,
      userId: profileRow.id,
      type: "team_pricing_migration",
      subject: "Atlas HR Team pricing update",
      react: createElement(TeamPricingMigration, {
        firstName,
        legacyUntil,
        currentMonthly: currency(legacyMonthly),
        newMonthly: currency(newMonthly),
        lockInUrl: `${appUrl}/workspace/settings/billing?lock_in=team_legacy`,
        billingUrl: `${appUrl}/workspace/settings/billing`,
      }),
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
