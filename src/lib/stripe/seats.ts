import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/stripe/products";
import { stripe } from "@/lib/stripe/server";

type DbError = { message: string };
type QueryResult<T> = Promise<{ data: T | null; error: DbError | null }>;

type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string, options?: Record<string, unknown>): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: readonly string[]): QueryBuilder<T>;
  single(): QueryResult<T>;
  maybeSingle(): QueryResult<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  then<TResult1 = { data: T[] | null; error: DbError | null; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T[] | null; error: DbError | null; count: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};

type UntypedSupabase = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

type SubscriptionRow = {
  stripe_subscription_id: string;
  status: string;
  plan: "team" | "business" | "enterprise";
  billing_interval: "month" | "year";
  legacy_pricing?: boolean | null;
  legacy_until?: string | null;
};

type SeatSyncResult = {
  seats: number;
  includedSeats: number;
  additionalSeats: number;
  synced: boolean;
};

async function countOrgMembers(supabase: UntypedSupabase, orgId: string) {
  const { count, error } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countBillableEmployees(supabase: UntypedSupabase, orgId: string) {
  const { count, error } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .in("status", ["active", "on_leave"]);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

function legacyStillApplies(subscription: Pick<SubscriptionRow, "legacy_pricing" | "legacy_until">) {
  if (!subscription.legacy_pricing) return false;
  if (!subscription.legacy_until) return true;
  return new Date(subscription.legacy_until) >= new Date();
}

export async function syncOrgSeats(orgId: string): Promise<SeatSyncResult> {
  const supabase = createAdminClient() as unknown as UntypedSupabase;
  const seats = Math.max(await countBillableEmployees(supabase, orgId), 1);

  const { data: sub } = await supabase
    .from<SubscriptionRow>("subscriptions")
    .select("stripe_subscription_id, status, plan, billing_interval, legacy_pricing, legacy_until")
    .eq("org_id", orgId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  const planConfig = sub?.plan === "business" ? PLANS.business : PLANS.team;
  const includedSeats = planConfig.includedSeats;
  const additionalSeats = Math.max(0, seats - includedSeats);

  if (!sub) {
    return { seats, includedSeats, additionalSeats, synced: false };
  }

  if (sub.plan === "team" && legacyStillApplies(sub)) {
    await supabase
      .from("subscriptions")
      .update({ quantity: seats })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);
    return { seats, includedSeats, additionalSeats, synced: false };
  }

  const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
    expand: ["items.data.price"],
  });

  const seatItem = subscription.items.data.find((item) => {
    const priceId = item.price.id;
    return (
      priceId === planConfig.stripePriceIds.seatMonthly ||
      priceId === planConfig.stripePriceIds.seatYearly
    );
  });

  if (additionalSeats === 0) {
    if (seatItem) {
      await stripe.subscriptionItems.del(seatItem.id, {
        proration_behavior: "create_prorations",
      });
    }
  } else if (seatItem) {
    if (seatItem.quantity !== additionalSeats) {
      await stripe.subscriptionItems.update(seatItem.id, {
        quantity: additionalSeats,
        proration_behavior: "create_prorations",
      });
    }
  } else {
    const interval = subscription.items.data[0]?.price.recurring?.interval;
    const seatPriceId =
      interval === "year"
        ? planConfig.stripePriceIds.seatYearly
        : planConfig.stripePriceIds.seatMonthly;

    await stripe.subscriptionItems.create({
      subscription: subscription.id,
      price: seatPriceId,
      quantity: additionalSeats,
      proration_behavior: "create_prorations",
    });
  }

  await supabase
    .from("subscriptions")
    .update({
      quantity: seats,
      stripe_seat_price_id:
        additionalSeats > 0
          ? sub.billing_interval === "year"
            ? planConfig.stripePriceIds.seatYearly
            : planConfig.stripePriceIds.seatMonthly
          : null,
    })
    .eq("stripe_subscription_id", sub.stripe_subscription_id);

  return { seats, includedSeats, additionalSeats, synced: true };
}

export async function canInviteMember(orgId: string): Promise<{
  allowed: boolean;
  reason?: string;
  seatsRemaining?: number;
  memberCount?: number;
}> {
  const supabase = createAdminClient() as unknown as UntypedSupabase;

  const { data: sub } = await supabase
    .from<Pick<SubscriptionRow, "status">>("subscriptions")
    .select("status")
    .eq("org_id", orgId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (!sub) return { allowed: false, reason: "No active subscription" };

  const memberCount = await countOrgMembers(supabase, orgId);
  if (sub.status === "trialing" && memberCount >= 50) {
    return {
      allowed: false,
      reason: "Trial limit: 50 workspace members. Contact support to add more during trial.",
      seatsRemaining: 0,
      memberCount,
    };
  }

  return {
    allowed: true,
    seatsRemaining: sub.status === "trialing" ? Math.max(50 - memberCount, 0) : undefined,
    memberCount,
  };
}

export function getInviteSeatImpact(memberCount: number, interval: "month" | "year" = "month") {
  const nextSeatCount = memberCount + 1;
  const employeeCountedPricing = true;

  return {
    memberCount,
    nextSeatCount,
    includedSeats: Infinity,
    currentAdditional: 0,
    nextAdditional: 0,
    incrementalSeats: 0,
    incrementalAmount: 0,
    interval,
    employeeCountedPricing,
  };
}
