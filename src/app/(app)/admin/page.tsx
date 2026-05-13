import type { Metadata } from "next";
import { Users, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team_admin: "Team Admin",
  team_member: "Team Member",
  business_admin: "Business Admin",
  business_member: "Business Member",
  enterprise: "Enterprise",
  moderator: "Moderator",
  admin: "Admin",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-[--text-tertiary]",
  pro: "bg-[--accent]",
  team_admin: "bg-chart-4",
  team_member: "bg-chart-4/70",
  business_admin: "bg-chart-1",
  business_member: "bg-chart-1/70",
  enterprise: "bg-amber-500",
  moderator: "bg-teal-500",
  admin: "bg-[--danger]",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const now = new Date();
  const day7ago = new Date(now.getTime() - 7 * 86400000).toISOString();
  const day30ago = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    { count: totalUsers },
    { data: roleCounts },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { count: totalDocs },
    { count: docsWeek },
    { count: totalConvos },
    { count: convosWeek },
    { data: topTools },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("role"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", day7ago),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", day30ago),
    supabase.from("generated_documents").select("*", { count: "exact", head: true }),
    supabase.from("generated_documents").select("*", { count: "exact", head: true }).gte("created_at", day7ago),
    supabase.from("copilot_conversations").select("*", { count: "exact", head: true }),
    supabase.from("copilot_conversations").select("*", { count: "exact", head: true }).gte("created_at", day7ago),
    supabase.from("generated_documents").select("tool_slug").order("created_at", { ascending: false }).limit(500),
  ]);

  // Group roles
  const byRole = (roleCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    const r = (row as { role: string }).role;
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  // Top tools by generation count
  const toolCounts = (topTools ?? []).reduce<Record<string, number>>((acc, row) => {
    const slug = (row as { tool_slug: string }).tool_slug;
    acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});
  const topToolsList = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const metrics = [
    {
      label: "Total users",
      value: totalUsers ?? 0,
      sub: `+${newUsersWeek ?? 0} this week`,
      icon: Users,
    },
    {
      label: "Documents generated",
      value: totalDocs ?? 0,
      sub: `+${docsWeek ?? 0} this week`,
      icon: FileText,
    },
    {
      label: "Copilot conversations",
      value: totalConvos ?? 0,
      sub: `+${convosWeek ?? 0} this week`,
      icon: MessageSquare,
    },
    {
      label: "New users (30d)",
      value: newUsersMonth ?? 0,
      sub: `${newUsersWeek ?? 0} in last 7 days`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[--text-primary]">Overview</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">Platform-wide metrics across all users.</p>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">{label}</p>
              <Icon size={16} className="text-[--accent]" />
            </div>
            <p className="mt-2 text-3xl font-bold text-[--text-primary]">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[--text-secondary]">{sub}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Users by plan */}
        <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <h2 className="font-semibold text-[--text-primary]">Users by plan</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(byRole)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <div key={role}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${PLAN_COLORS[role] ?? "bg-[--text-tertiary]"}`} />
                      <span className="text-[--text-secondary]">{PLAN_LABELS[role] ?? role}</span>
                    </div>
                    <span className="font-semibold text-[--text-primary]">
                      {count} ({totalUsers ? Math.round((count / totalUsers) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[--bg-input]">
                    <div
                      className={`h-2 rounded-full ${PLAN_COLORS[role] ?? "bg-[--accent]"}`}
                      style={{ width: `${totalUsers ? Math.max(4, (count / totalUsers) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top tools */}
        <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <h2 className="font-semibold text-[--text-primary]">Most-used tools (last 500 docs)</h2>
          <div className="mt-4 space-y-3">
            {topToolsList.length === 0 && (
              <p className="text-sm text-[--text-tertiary]">No documents generated yet.</p>
            )}
            {topToolsList.map(([slug, count]) => (
              <div key={slug}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-[--text-secondary]">{slug.replace(/-/g, " ")}</span>
                  <span className="font-semibold text-[--text-primary]">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[--bg-input]">
                  <div
                    className="h-2 rounded-full bg-[--accent]"
                    style={{
                      width: `${topToolsList[0] ? Math.max(4, (count / topToolsList[0][1]) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
