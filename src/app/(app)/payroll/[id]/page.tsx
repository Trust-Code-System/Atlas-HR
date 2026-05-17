import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PayrollActions } from "./payroll-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll Run" };

function fmt(n: number | null | undefined, currency: string) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
}

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  draft:      { pill: "bg-navy-100 text-navy-600 border border-navy-200",       dot: "bg-navy-400" },
  processing: { pill: "bg-amber-50 text-amber-700 border border-amber-200",     dot: "bg-amber-400" },
  approved:   { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  paid:       { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
};

export default async function PayrollRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!run) notFound();

  const { data: entries } = await supabase
    .from("payroll_entries")
    .select("*")
    .eq("run_id", id)
    .order("created_at");

  const allEntries = entries ?? [];
  const empIds = allEntries.map((e) => e.employee_id);

  const { data: employees } = empIds.length
    ? await supabase
        .from("employees")
        .select("id, full_name, job_title, department")
        .in("id", empIds)
    : { data: [] };

  const empMap = Object.fromEntries((employees ?? []).map((e) => [e.id, e]));

  const sv = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.draft;
  const periodStart = new Date(run.pay_period_start).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const periodEnd   = new Date(run.pay_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const deductions  = run.total_gross != null && run.total_net != null ? run.total_gross - run.total_net : null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/payroll" className="hover:text-white transition-colors">Payroll</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{run.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{run.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {run.status}
                </span>
              </div>
              <p className="font-mono text-sm text-blue-300">
                {periodStart} – {periodEnd}
              </p>
              {run.run_date && (
                <p className="font-mono text-xs text-blue-400 mt-0.5">
                  Paid on {new Date(run.run_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Gross</p>
                <p className="font-mono text-xl font-bold text-white tabular-nums">{fmt(run.total_gross, run.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Net</p>
                <p className="font-mono text-xl font-bold text-emerald-300 tabular-nums">{fmt(run.total_net, run.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Deductions</p>
                <p className="font-mono text-xl font-bold text-red-300 tabular-nums">{fmt(deductions, run.currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions */}
      {orgCtx.isAdmin && (run.status === "draft" || run.status === "approved") && (
        <div className="bg-white rounded-2xl border border-navy-200 p-4 mb-6 shadow-sm">
          <PayrollActions runId={run.id} status={run.status} />
        </div>
      )}

      {/* Entries table */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-navy-200 bg-navy-50/80 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Employee entries</h2>
          <span className="text-xs font-bold text-navy-500 bg-navy-100 border border-navy-200 rounded-full px-2.5 py-1">
            {allEntries.length}
          </span>
        </div>

        {allEntries.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/40 border-b border-navy-100 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-4">Employee</div>
              <div className="col-span-2 hidden sm:block">Department</div>
              <div className="col-span-2">Gross</div>
              <div className="col-span-2">Deductions</div>
              <div className="col-span-2">Net pay</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allEntries.map((entry) => {
                const emp = empMap[entry.employee_id];
                return (
                  <div key={entry.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-navy-50/40 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate">{emp?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-navy-400 truncate">{emp?.job_title ?? ""}</p>
                    </div>
                    <div className="col-span-2 hidden sm:block text-sm text-navy-600 truncate">
                      {emp?.department ?? "—"}
                    </div>
                    <div className="col-span-2 font-mono text-sm text-navy-700 tabular-nums">
                      {fmt(entry.gross_pay, run.currency)}
                    </div>
                    <div className="col-span-2 font-mono text-sm text-red-600 tabular-nums">
                      -{fmt(entry.deductions, run.currency)}
                    </div>
                    <div className="col-span-2 font-mono text-sm font-semibold text-blue-700 tabular-nums">
                      {fmt(entry.net_pay, run.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-12 gap-4 px-5 py-4 bg-navy-50/80 border-t border-navy-200 font-mono text-sm font-semibold tabular-nums">
              <div className="col-span-4 sm:col-span-6 text-navy-600 font-sans font-semibold">
                Total ({allEntries.length} employee{allEntries.length !== 1 ? "s" : ""})
              </div>
              <div className="col-span-2 text-navy-800">{fmt(run.total_gross, run.currency)}</div>
              <div className="col-span-2 text-red-600">-{fmt(deductions, run.currency)}</div>
              <div className="col-span-2 text-blue-700">{fmt(run.total_net, run.currency)}</div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-sm text-navy-400">
            No entries in this payroll run. No active employees with salaries were found.
          </div>
        )}
      </div>

      {run.notes && (
        <div className="bg-white rounded-2xl border border-navy-200 p-5 mt-6 shadow-sm">
          <h3 className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Notes</h3>
          <p className="text-sm text-navy-700 whitespace-pre-line leading-relaxed">{run.notes}</p>
        </div>
      )}
    </div>
  );
}
