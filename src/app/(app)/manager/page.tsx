import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getManagerContext } from "@/lib/ai/manager-context";
import { ManagerBriefPanel } from "./manager-brief-panel";

export const metadata: Metadata = { title: "Manager Assistant | Atlas HR" };

export default async function ManagerPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const ctx = await getManagerContext(supabase, orgCtx.org.id, user.id, user.email ?? null);

  const stats = [
    { label: "Direct reports", value: ctx.reports.length, href: "/org/people" },
    { label: "Leave to approve", value: ctx.pendingLeave.length, href: "/org/leave?status=pending", warn: ctx.pendingLeave.length > 0 },
    { label: "Timesheets to approve", value: ctx.pendingTimesheets.length, href: "/time", warn: ctx.pendingTimesheets.length > 0 },
    { label: "Open tasks", value: ctx.openTasks.length, href: "/tasks" },
    { label: "Open cases", value: ctx.openCases.length, href: "/disciplinary", warn: ctx.openCases.length > 0 },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Manager Assistant</h1>
            <p className="text-blue-300 text-sm mt-0.5">Your team at a glance, summarised by Atlas AI</p>
          </div>
        </div>
      </div>

      {!ctx.manages ? (
        <div className="bg-white rounded-2xl border border-navy-200 text-center py-16 shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-navy-100 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">No direct reports yet</h3>
          <p className="text-sm text-navy-500 max-w-sm mx-auto">
            Once employees list you as their manager in Atlas, your team brief and pending items will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((s) => (
              <Link key={s.label} href={s.href}
                className="relative flex flex-col rounded-[18px] border border-navy-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className={`font-mono text-2xl font-semibold tabular-nums ${s.warn ? "text-amber-600" : "text-navy-950"}`}>{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-navy-600">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* AI brief */}
          <ManagerBriefPanel />

          {/* Reports list */}
          <div className="bg-white rounded-2xl border border-navy-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-100 bg-navy-50/40">
              <h2 className="text-sm font-bold text-navy-800">Your team ({ctx.reports.length})</h2>
            </div>
            <div className="divide-y divide-navy-100">
              {ctx.reports.map((r) => (
                <Link key={r.id} href={`/org/people/${r.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-navy-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{r.full_name}</p>
                    <p className="text-xs text-navy-400">{r.job_title ?? r.department ?? "—"}</p>
                  </div>
                  <span className="text-xs text-navy-400 capitalize">{r.status.replace("_", " ")}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
