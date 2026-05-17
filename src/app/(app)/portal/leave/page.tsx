import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeavePortalClient } from "./leave-portal-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Leave | Atlas HR" };

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;
}

export default async function PortalLeavePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const employee = await getMyEmployee();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-6 text-center mt-8">
          <p className="text-sm text-amber-700">Your account is not linked to an employee record. Ask your HR admin to link your profile.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const thisYear = new Date().getFullYear().toString();
  const approved = (leaveRequests ?? []).filter(
    (r) => r.status === "approved" && r.start_date.startsWith(thisYear)
  );
  const daysUsed = approved.reduce((sum, r) => sum + daysBetween(r.start_date, r.end_date), 0);
  const pendingCount = (leaveRequests ?? []).filter((r) => r.status === "pending").length;

  const kpis = [
    { label: "Days used", value: daysUsed, sub: `approved this year`, strip: "from-blue-400 to-blue-600" },
    { label: "Pending", value: pendingCount, sub: "awaiting approval", strip: "from-amber-400 to-orange-500" },
    { label: "Total requests", value: leaveRequests?.length ?? 0, sub: "all time", strip: "from-violet-400 to-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Leave</h1>
            <p className="text-blue-300 text-sm mt-0.5">{employee.full_name}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <LeavePortalClient leaveRequests={leaveRequests ?? []} />
    </div>
  );
}
