import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { LeaveClient } from "./leave-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leave Management | Atlas HR" };

export default async function LeavePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const { org, isAdmin } = orgData;
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, job_title")
    .eq("org_id", org.id)
    .order("full_name");

  const employeeIds = employees?.map((e) => e.id) ?? [];

  const { data: leaveRequests } = employeeIds.length
    ? await supabase
        .from("leave_requests")
        .select("*")
        .in("employee_id", employeeIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const employeeMap = Object.fromEntries((employees ?? []).map((e) => [e.id, e]));

  const counts = {
    all:      leaveRequests?.length ?? 0,
    pending:  leaveRequests?.filter((r) => r.status === "pending").length ?? 0,
    approved: leaveRequests?.filter((r) => r.status === "approved").length ?? 0,
    rejected: leaveRequests?.filter((r) => r.status === "rejected").length ?? 0,
  };

  const kpis = [
    { label: "Total requests", value: counts.all,      strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Pending",        value: counts.pending,  strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Approved",       value: counts.approved, strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Rejected",       value: counts.rejected, strip: "from-red-400 to-rose-500",     grad: "from-red-500 to-rose-600",     icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leave Management</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {org.name}
              {counts.pending > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                  {counts.pending} pending approval
                </span>
              )}
            </p>
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
          </div>
        ))}
      </div>

      <LeaveClient
        leaveRequests={leaveRequests ?? []}
        employees={employees ?? []}
        employeeMap={employeeMap as Record<string, { id: string; full_name: string; job_title: string | null }>}
        isAdmin={isAdmin}
      />
    </div>
  );
}
