import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BarFill, MonthlyBarColumn, StackedBarSegment, StatusBarFill } from "./analytics-bars";

export const metadata: Metadata = { title: "Analytics | Atlas HR" };

type Employee = {
  id: string;
  full_name: string;
  department: string | null;
  status: "active" | "on_leave" | "terminated";
  employment_type: "full_time" | "part_time" | "contract" | "intern" | null;
  start_date: string | null;
  country: string | null;
};

type LeaveRequest = {
  id: string;
  leave_type: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  start_date: string;
  end_date: string;
};

function BarRow({
  label,
  value,
  max,
  color = "bg-blue-500",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-navy-700 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-navy-100 rounded-full h-2.5 overflow-hidden">
        <BarFill pct={pct} color={color} />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-navy-800 shrink-0">{value}</span>
    </div>
  );
}

export default async function AnalyticsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, department, status, employment_type, start_date, country")
    .eq("org_id", orgCtx.org.id);

  const empIds = (employees ?? []).map((e) => e.id);
  const { data: leaves } = empIds.length > 0
    ? await supabase
        .from("leave_requests")
        .select("id, leave_type, status, start_date, end_date")
        .in("employee_id", empIds)
    : { data: [] as LeaveRequest[] };

  const allEmployees: Employee[] = employees ?? [];
  const allLeaves: LeaveRequest[] = leaves ?? [];

  const total = allEmployees.length;
  const active = allEmployees.filter((e) => e.status === "active").length;
  const onLeave = allEmployees.filter((e) => e.status === "on_leave").length;
  const terminated = allEmployees.filter((e) => e.status === "terminated").length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires30d = allEmployees.filter(
    (e) => e.start_date && new Date(e.start_date) >= thirtyDaysAgo
  ).length;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newHires90d = allEmployees.filter(
    (e) => e.start_date && new Date(e.start_date) >= ninetyDaysAgo
  ).length;

  const deptMap = new Map<string, number>();
  for (const e of allEmployees.filter((e) => e.status !== "terminated")) {
    const dept = e.department ?? "Unassigned";
    deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1);
  }
  const deptRows = [...deptMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const deptMax = deptRows[0]?.[1] ?? 1;

  const typeMap: Record<string, number> = { full_time: 0, part_time: 0, contract: 0, intern: 0 };
  for (const e of allEmployees.filter((e) => e.status !== "terminated")) {
    const t = e.employment_type ?? "full_time";
    typeMap[t] = (typeMap[t] ?? 0) + 1;
  }
  const typeLabels: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern" };
  const typeColors: Record<string, string> = { full_time: "bg-blue-500", part_time: "bg-blue-400", contract: "bg-amber-400", intern: "bg-purple-400" };
  const typeMax = Math.max(...Object.values(typeMap), 1);

  const leaveTypeMap = new Map<string, number>();
  for (const l of allLeaves.filter((l) => l.status === "approved")) {
    leaveTypeMap.set(l.leave_type, (leaveTypeMap.get(l.leave_type) ?? 0) + 1);
  }
  const leaveRows = [...leaveTypeMap.entries()].sort((a, b) => b[1] - a[1]);
  const leaveMax = leaveRows[0]?.[1] ?? 1;

  const pendingLeaves = allLeaves.filter((l) => l.status === "pending").length;
  const approvedLeaves = allLeaves.filter((l) => l.status === "approved").length;
  const rejectedLeaves = allLeaves.filter((l) => l.status === "rejected").length;

  const countryMap = new Map<string, number>();
  for (const e of allEmployees.filter((e) => e.status !== "terminated")) {
    const c = e.country ?? "Unknown";
    countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
  }
  const countryRows = [...countryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const countryMax = countryRows[0]?.[1] ?? 1;

  const monthlyHires: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const count = allEmployees.filter((e) => {
      if (!e.start_date) return false;
      const sd = new Date(e.start_date);
      return sd >= start && sd <= end;
    }).length;
    monthlyHires.push({ label, count });
  }
  const monthMax = Math.max(...monthlyHires.map((m) => m.count), 1);

  const kpis = [
    {
      label: "Total headcount",
      value: total,
      strip: "from-blue-400 to-blue-600",
      grad: "from-blue-500 to-blue-700",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      label: "Active",
      value: active,
      strip: "from-emerald-400 to-teal-500",
      grad: "from-emerald-500 to-teal-600",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "On leave",
      value: onLeave,
      strip: "from-amber-400 to-orange-500",
      grad: "from-amber-500 to-orange-600",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      sub: `${total > 0 ? Math.round((onLeave / total) * 100) : 0}% of workforce`,
    },
    {
      label: "New hires (30d)",
      value: newHires30d,
      strip: "from-violet-400 to-purple-500",
      grad: "from-violet-500 to-purple-600",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
      sub: `${newHires90d} in last 90 days`,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
            <p className="text-blue-300 text-sm mt-0.5">People insights for {orgCtx.org.name}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
            {k.sub && <p className="mt-0.5 text-xs text-navy-400">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Department breakdown */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-1">Headcount by department</h2>
          <p className="text-xs text-navy-400 mb-5">Active + on leave employees</p>
          {deptRows.length > 0 ? (
            <div className="space-y-3.5">
              {deptRows.map(([dept, count]) => (
                <BarRow key={dept} label={dept} value={count} max={deptMax} color="bg-blue-500" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-400 py-4 text-center">No department data yet</p>
          )}
        </div>

        {/* Monthly new hires */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-1">New hires by month</h2>
          <p className="text-xs text-navy-400 mb-5">Last 6 months</p>
          <div className="flex items-end gap-2 h-40">
            {monthlyHires.map(({ label, count }) => {
              const pct = monthMax > 0 ? Math.round((count / monthMax) * 100) : 0;
              return (
                <div key={label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-navy-700">{count > 0 ? count : ""}</span>
                  <div className="w-full flex flex-col justify-end h-[100px]">
                    <MonthlyBarColumn pct={pct} hasCount={count > 0} />
                  </div>
                  <span className="text-xs text-navy-400 truncate w-full text-center">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Employment type */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-1">Employment type</h2>
          <p className="text-xs text-navy-400 mb-5">Active workforce breakdown</p>
          <div className="space-y-3.5">
            {Object.entries(typeMap).map(([type, count]) => (
              <BarRow key={type} label={typeLabels[type] ?? type} value={count} max={typeMax} color={typeColors[type] ?? "bg-blue-500"} />
            ))}
          </div>
          <div className="mt-5 flex h-3 rounded-full overflow-hidden gap-px">
            {Object.entries(typeMap).map(([type, count]) => {
              const pct = active + onLeave > 0 ? (count / (active + onLeave)) * 100 : 0;
              return pct > 0 ? (
                <StackedBarSegment
                  key={type}
                  pct={pct}
                  color={typeColors[type] ?? "bg-blue-500"}
                  title={`${typeLabels[type]}: ${count}`}
                />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(typeMap).map(([type, count]) =>
              count > 0 ? (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-sm ${typeColors[type] ?? "bg-blue-500"}`} />
                  <span className="text-xs text-navy-500">{typeLabels[type]}</span>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Leave overview */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-1">Leave overview</h2>
          <p className="text-xs text-navy-400 mb-5">All-time leave requests</p>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-amber-700">{pendingLeaves} pending</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-blue-700">{approvedLeaves} approved</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-700">{rejectedLeaves} rejected</span>
            </div>
          </div>
          {leaveRows.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">Approved by type</p>
              {leaveRows.map(([type, count]) => (
                <BarRow key={type} label={type} value={count} max={leaveMax} color="bg-blue-400" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-400 text-center py-2">No approved leave yet</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status summary */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-4">Workforce status</h2>
          <div className="space-y-3">
            {[
              { label: "Active",     value: active,     color: "bg-blue-500" },
              { label: "On leave",   value: onLeave,    color: "bg-amber-400" },
              { label: "Terminated", value: terminated, color: "bg-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-navy-700">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-navy-100 rounded-full h-1.5 overflow-hidden">
                    <StatusBarFill pct={total > 0 ? (value / total) * 100 : 0} color={color} />
                  </div>
                  <span className="text-sm font-bold text-navy-800 w-6 text-right">{value}</span>
                </div>
              </div>
            ))}
          </div>
          {total === 0 && (
            <p className="text-sm text-navy-400 text-center py-2 mt-2">
              No employees yet.{" "}
              <Link href="/org/people/new" className="text-blue-600 hover:underline">Add one</Link>
            </p>
          )}
        </div>

        {/* Country breakdown */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-4">Top locations</h2>
          {countryRows.length > 0 ? (
            <div className="space-y-3.5">
              {countryRows.map(([country, count]) => (
                <BarRow key={country} label={country} value={count} max={countryMax} color="bg-violet-500" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-400 text-center py-4">No location data</p>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm flex flex-col">
          <h2 className="font-bold text-navy-900 mb-1">People actions</h2>
          <p className="text-xs text-navy-400 mb-5">Jump to common HR tasks</p>
          <div className="space-y-1 flex-1">
            {[
              { href: "/org/people",       label: "View all employees",     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
              { href: "/org/people/new",   label: "Add new employee",        icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
              { href: "/org/leave",        label: "Review leave requests",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { href: "/org/chart",        label: "View org chart",          icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 text-sm text-navy-700 hover:text-blue-700 font-medium py-1.5 transition-colors group"
              >
                <svg className="h-[15px] w-[15px] shrink-0 text-navy-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </Link>
            ))}
          </div>
          {orgCtx.isAdmin && pendingLeaves > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-700">
                {pendingLeaves} leave request{pendingLeaves !== 1 ? "s" : ""} awaiting approval
              </p>
              <Link href="/org/leave" className="text-xs text-amber-600 hover:underline">
                Review now →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
