import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AccountLinkNotice } from "./account-link-notice";

export const metadata: Metadata = { title: "My Portal | Atlas HR" };

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;
}

export default async function PortalPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const employee = await getMyEmployee();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">My Portal</h1>
              <p className="text-blue-300 text-sm mt-0.5">{orgData.org.name}</p>
            </div>
          </div>
        </div>
        <AccountLinkNotice isAdmin={orgData.isAdmin} orgName={orgData.org.name} />
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: leaveRequests }, { data: docs }, { data: payrollEntries }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("employee_documents")
      .select("id, file_name, doc_type, created_at")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("payroll_entries")
      .select("id, net_pay, gross_pay, run_id, created_at")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const thisYear = new Date().getFullYear().toString();
  const leaveThisYear = (leaveRequests ?? []).filter(
    (r) => r.start_date.startsWith(thisYear) && r.status === "approved"
  );
  const daysUsed = leaveThisYear.reduce(
    (sum, r) => sum + daysBetween(r.start_date, r.end_date),
    0
  );
  const pendingCount = (leaveRequests ?? []).filter((r) => r.status === "pending").length;

  const quickLinks = [
    { href: "/portal/leave", label: "Request Leave", desc: "Submit or view leave requests", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "from-blue-500 to-blue-700" },
    { href: "/portal/profile", label: "My Profile", desc: "View and update your details", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "from-violet-500 to-purple-700" },
    { href: "/portal/documents", label: "My Documents", desc: "View your HR documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "from-teal-500 to-emerald-700" },
    { href: "/portal/payslips", label: "My Payslips", desc: "View payroll summaries", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {employee.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {employee.full_name.split(" ")[0]}</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {[employee.job_title, employee.department].filter(Boolean).join(" · ")}
              {employee.status === "on_leave" && (
                <span className="ml-2 inline-flex items-center bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                  On leave
                </span>
              )}
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="shrink-0 bg-amber-500/20 ring-1 ring-amber-400/30 text-amber-300 text-sm font-semibold px-3 py-1.5 rounded-full">
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Leave days used", value: daysUsed, sub: "this year (approved)", color: "from-blue-400 to-blue-600" },
          { label: "Pending requests", value: pendingCount, sub: "awaiting approval", color: "from-amber-400 to-orange-500" },
          { label: "Documents", value: docs?.length ?? 0, sub: "on file", color: "from-teal-400 to-emerald-500" },
          { label: "Latest net pay", value: payrollEntries?.[0] ? `${employee.salary_currency} ${Number(payrollEntries[0].net_pay).toLocaleString()}` : "—", sub: "most recent payslip", color: "from-violet-400 to-purple-600" },
        ].map((s) => (
          <div key={s.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${s.color}`} />
            <p className="font-mono text-2xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{s.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((ql) => (
          <Link
            key={ql.href}
            href={ql.href}
            className="group flex flex-col rounded-[18px] border border-navy-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${ql.color} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ql.icon} />
              </svg>
            </div>
            <p className="font-semibold text-navy-900 text-sm group-hover:text-blue-700 transition-colors">{ql.label}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{ql.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent leave */}
      {leaveRequests && leaveRequests.length > 0 && (
        <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy-900 text-sm">Recent leave requests</h2>
            <Link href="/portal/leave" className="text-xs font-semibold text-blue-600 hover:text-blue-800">View all →</Link>
          </div>
          <div className="divide-y divide-navy-50">
            {leaveRequests.map((r) => {
              const badge =
                r.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : r.status === "pending" ? "bg-amber-50 text-amber-700 ring-amber-200"
                  : "bg-red-50 text-red-700 ring-red-200";
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 capitalize">{r.leave_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.start_date)} – {formatDate(r.end_date)}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 capitalize ${badge}`}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
