import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { PayrollRun } from "@/types/database";
import { AccountLinkNotice } from "../account-link-notice";

export const metadata: Metadata = { title: "My Payslips | Atlas HR" };

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PortalPayslipsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const employee = await getMyEmployee();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <div className="mt-8">
          <AccountLinkNotice isAdmin={orgData.isAdmin} orgName={orgData.org.name} />
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("payroll_entries")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const runIds = [...new Set((entries ?? []).map((e) => e.run_id))];

  let runMap: Record<string, PayrollRun> = {};
  if (runIds.length > 0) {
    const { data: runs } = await supabase
      .from("payroll_runs")
      .select("*")
      .in("id", runIds);
    runMap = Object.fromEntries((runs ?? []).map((r) => [r.id, r]));
  }

  const totalNetYTD = (entries ?? [])
    .filter((e) => {
      const run = runMap[e.run_id];
      return run && new Date(run.pay_period_start).getFullYear() === new Date().getFullYear();
    })
    .reduce((sum, e) => sum + e.net_pay, 0);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Payslips</h1>
            <p className="text-amber-300 text-sm mt-0.5">
              {entries?.length ?? 0} payslip{entries?.length !== 1 ? "s" : ""}
              {totalNetYTD > 0 && ` · ${fmt(totalNetYTD, employee.salary_currency)} net YTD`}
            </p>
          </div>
        </div>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="rounded-[18px] border border-navy-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-navy-700 font-semibold text-sm">No payslips yet</p>
          <p className="text-slate-400 text-xs mt-1">Payslips will appear here once payroll has been run.</p>
        </div>
      ) : (
        <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">Pay period</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400">Gross pay</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400">Deductions</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400">Net pay</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {entries.map((entry) => {
                const run = runMap[entry.run_id];
                const currency = run?.currency ?? employee.salary_currency;
                const statusBadge =
                  run?.status === "paid" ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : run?.status === "approved" ? "bg-blue-50 text-blue-700 ring-blue-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200";

                return (
                  <tr key={entry.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-navy-900">{run?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {run ? `${formatDate(run.pay_period_start)} – ${formatDate(run.pay_period_end)}` : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-navy-900 tabular-nums">
                      {fmt(entry.gross_pay, currency)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-red-600 tabular-nums">
                      -{fmt(entry.deductions, currency)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-navy-950 tabular-nums">
                      {fmt(entry.net_pay, currency)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 capitalize ${statusBadge}`}>
                        {run?.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
