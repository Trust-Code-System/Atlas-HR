import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { FEATURES, getLimits, type FeatureKey, type UserRole } from "@/lib/limits";

type QueryResult<T> = Promise<{ data: T | null }>;
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: readonly string[]): QueryBuilder<T>;
  order(column: string, options?: Record<string, unknown>): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): QueryResult<T>;
  maybeSingle(): QueryResult<T>;
};
type UntypedSupabase = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

type ProfileWithPlan = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
};

type SubscriptionRow = {
  id: string;
  plan: "pro" | "team" | "business" | "enterprise";
  status: string;
  current_period_end: string;
};

export const getUserWithPlan = cache(async () => {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      subscription: null,
      role: "free" as UserRole,
      plan: "free" as const,
      features: FEATURES.free,
      limits: getLimits("free"),
    };
  }

  const db = supabase as unknown as UntypedSupabase;
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    db
      .from<ProfileWithPlan>("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .single(),
    db
      .from<SubscriptionRow>("subscriptions")
      .select("id, plan, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const role = (profile?.role ?? "free") as UserRole;
  const plan =
    subscription?.plan ??
    (role === "team_admin" || role === "team_member"
      ? "team"
      : role === "business_admin" || role === "business_member"
        ? "business"
        : role === "enterprise"
          ? "enterprise"
          : role === "pro"
            ? "pro"
            : "free");

  return {
    user,
    profile,
    subscription,
    role,
    plan,
    features: FEATURES[role] ?? FEATURES.free,
    limits: getLimits(role),
  };
});

export type UserWithPlan = Awaited<ReturnType<typeof getUserWithPlan>>;
export type { FeatureKey };
