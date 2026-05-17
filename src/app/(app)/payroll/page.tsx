import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll | Atlas HR" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  draft:      { pill: "bg-navy-100 text-navy-600 border border-navy-200",     dot: "bg-navy-400" },
  processing: { pill: "bg-amber-50 text-amber-700 border border-amber-200",   dot: "bg-amber-400" },
  approved:   { pill: "bg-blue-50 text-blue-700 border border-blue-200",      dot: "bg-blue-500" },
  paid:       { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
};

function fmt(n: number | null, currency: string) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export default async function PayrollPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .order("created_at", { ascending: false });

  const allRuns = runs ?? [];
  const totalPaid   = allRuns.filter((r) => r.status === "paid").reduce((s, r) => s + (r.total_net ?? 0), 0);
  const pendingRuns = allRuns.filter((r) => r.status !== "paid").length;
  const paidRuns    = allRuns.filter((r) => r.status === "paid").length;

  const kpis = [
    { label: "Total runs",       value: allRuns.length, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Paid runs",        value: paidRuns,       strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Pending / draft",  value: pendingRuns,    strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Total disbursed",  value: fmt(totalPaid, "GBP"), strip: "from-violet-400 to-purple-500", grad: "from-violet-500 to-purple-600", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", mono: true },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Payroll</h1>
              <p className="text-blue-300 text-sm mt-0.5">{orgCtx.org.name} · Payroll runs &amp; disbursements</p>
            </div>
          </div>
          {orgCtx.isAdmin && (
            <Link
              href="/payroll/new"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New payroll run
            </Link>
          )}
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
            <p className={`${k.mono ? "font-mono text-xl" : "font-mono text-3xl"} font-semibold leading-none tracking-tight text-navy-950 tabular-nums`}>{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Runs table */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {allRuns.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-4">Run name</div>
              <div className="col-span-3">Pay period</div>
              <div className="col-span-2 hidden sm:block">Gross</div>
              <div className="col-span-2 hidden sm:block">Net</div>
              <div className="col-span-3 sm:col-span-1">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allRuns.map((run) => {
                const sv = STATUS_VISUAL[run.status] ?? STATUS_VISUAL.draft;
                const periodStart = new Date(run.pay_period_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                const periodEnd   = new Date(run.pay_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <Link
                    key={run.id}
                    href={`/payroll/${run.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors group"
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-blue-700 transition-colors">{run.name}</p>
                      {run.run_date && (
                        <p className="font-mono text-xs text-navy-400 mt-0.5">
                          Paid {new Date(run.run_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 font-mono text-sm text-navy-600">
                      {periodStart} – {periodEnd}
                    </div>
                    <div className="col-span-2 hidden sm:block font-mono text-sm text-navy-600 tabular-nums">
                      {fmt(run.total_gross, run.currency)}
                    </div>
                    <div className="col-span-2 hidden sm:block font-mono text-sm font-bold text-navy-900 tabular-nums">
                      {fmt(run.total_net, run.currency)}
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                        {run.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No payroll runs yet</h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">Create your first payroll run to get started.</p>
            {orgCtx.isAdmin && (
              <Link href="/payroll/new"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New payroll run
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
