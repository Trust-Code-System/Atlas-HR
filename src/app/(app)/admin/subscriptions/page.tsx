import Link from "next/link";
import { CreditCard, TrendingUp, AlertCircle, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type Subscription = {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan: string;
  billing_interval: string;
  status: string;
  quantity: number | null;
  current_period_end: string;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  trial_end: string | null;
  created_at: string;
  user_id: string | null;
  org_id: string | null;
};

type Profile = { id: string; full_name: string | null; email: string };
type Org = { id: string; name: string };

type DbError = { message: string };
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(col: string, val: unknown): QueryBuilder<T>;
  in(col: string, vals: unknown[]): QueryBuilder<T>;
  order(column: string, options?: Record<string, unknown>): QueryBuilder<T>;
  then<R1 = { data: T[] | null; error: DbError | null }, R2 = never>(
    f?: ((v: { data: T[] | null; error: DbError | null }) => R1 | PromiseLike<R1>) | null,
    g?: ((r: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2>;
};
type UntypedSupabase = { from<T = Record<string, unknown>>(table: string): QueryBuilder<T> };

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro: { month: 1500, year: 14400 },
  team: { month: 4900, year: 47040 },
  enterprise: { month: 0, year: 0 },
};

function estimateMRR(sub: Subscription): number {
  const base = PLAN_PRICES[sub.plan]?.[sub.billing_interval] ?? 0;
  const qty = sub.quantity ?? 1;
  const monthly = sub.billing_interval === "year" ? Math.round(base / 12) : base;
  return monthly * qty;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function statusBadge(status: string, cancelAtEnd: boolean | null) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    trialing: "bg-accent-soft text-accent",
    past_due: "bg-amber-500/10 text-amber-700",
    canceled: "bg-[--bg-hover] text-[--text-tertiary]",
    paused: "bg-chart-4/10 text-chart-4",
    incomplete: "bg-red-500/10 text-red-600",
    incomplete_expired: "bg-red-500/10 text-red-600",
    unpaid: "bg-red-500/10 text-red-600",
  };
  const label = cancelAtEnd ? `${status} (cancels)` : status;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {label}
    </span>
  );
}

export default async function AdminSubscriptionsPage() {
  const supabase = createAdminClient() as unknown as UntypedSupabase;

  const { data: subs } = await supabase
    .from<Subscription>("subscriptions")
    .select(
      "id, stripe_subscription_id, stripe_customer_id, plan, billing_interval, status, quantity, current_period_end, cancel_at_period_end, canceled_at, trial_end, created_at, user_id, org_id"
    )
    .order("created_at", { ascending: false });

  const subscriptions = subs ?? [];

  const userIds = subscriptions.map((s) => s.user_id).filter(Boolean) as string[];
  const orgIds = subscriptions.map((s) => s.org_id).filter(Boolean) as string[];

  const [profilesRes, orgsRes] = await Promise.all([
    userIds.length
      ? supabase
          .from<Profile>("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] as Profile[] }),
    orgIds.length
      ? supabase
          .from<Org>("organisations")
          .select("id, name")
          .in("id", orgIds)
      : Promise.resolve({ data: [] as Org[] }),
  ]);

  const profileMap = Object.fromEntries(((profilesRes as { data: Profile[] | null }).data ?? []).map((p) => [p.id, p]));
  const orgMap = Object.fromEntries(((orgsRes as { data: Org[] | null }).data ?? []).map((o) => [o.id, o]));

  const active = subscriptions.filter((s) => s.status === "active" && !s.cancel_at_period_end);
  const trialing = subscriptions.filter((s) => s.status === "trialing");
  const pastDue = subscriptions.filter((s) => s.status === "past_due" || s.status === "unpaid");
  const mrr = active.reduce((sum, s) => sum + estimateMRR(s), 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[--text-primary]">Subscriptions</h1>
          <p className="mt-1 text-sm text-[--text-secondary]">Live billing status across all plans.</p>
        </div>
        <a
          href="https://dashboard.stripe.com/subscriptions"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[--border] px-4 py-2 text-sm font-medium hover:bg-[--bg-hover]"
        >
          Open Stripe dashboard ↗
        </a>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={CreditCard} label="Active" value={active.length} />
        <Metric icon={TrendingUp} label="Est. MRR" value={money(mrr)} />
        <Metric icon={Users} label="Trialing" value={trialing.length} />
        <Metric icon={AlertCircle} label="Past due" value={pastDue.length} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[--border]">
        <table className="w-full text-sm">
          <thead className="border-b border-[--border] bg-[--bg-card]">
            <tr>
              {["Account", "Plan", "Status", "Seats", "Renews / ends", "MRR est.", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[--text-secondary]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {subscriptions.map((sub) => {
              const profile = sub.user_id ? profileMap[sub.user_id] : undefined;
              const org = sub.org_id ? orgMap[sub.org_id] : undefined;
              const name = org?.name ?? profile?.full_name ?? profile?.email ?? "—";
              const email = profile?.email;
              const endDate = new Date(sub.current_period_end).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <tr key={sub.id} className="hover:bg-[--bg-hover]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[--text-primary]">{name}</p>
                    {email && <p className="text-xs text-[--text-secondary]">{email}</p>}
                  </td>
                  <td className="px-4 py-3 capitalize text-[--text-primary]">
                    {sub.plan} / {sub.billing_interval}
                  </td>
                  <td className="px-4 py-3">{statusBadge(sub.status, sub.cancel_at_period_end)}</td>
                  <td className="px-4 py-3 text-[--text-secondary]">{sub.quantity ?? 1}</td>
                  <td className="px-4 py-3 text-[--text-secondary]">{endDate}</td>
                  <td className="px-4 py-3 text-[--text-primary]">{money(estimateMRR(sub))}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[--accent] hover:underline"
                    >
                      Stripe ↗
                    </a>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[--text-tertiary]">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--bg-card] p-4">
      <Icon size={18} className="text-[--accent]" />
      <p className="mt-3 text-2xl font-semibold text-[--text-primary]">{value}</p>
      <p className="text-sm text-[--text-secondary]">{label}</p>
    </div>
  );
}
