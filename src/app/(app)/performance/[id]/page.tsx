import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CycleActions, CompletionBar } from "./cycle-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Review Cycle" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  draft:     { pill: "bg-navy-100 text-navy-600 border border-navy-200",         dot: "bg-navy-400" },
  active:    { pill: "bg-blue-50 text-blue-700 border border-blue-200",           dot: "bg-blue-500" },
  completed: { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",  dot: "bg-emerald-500" },
};

const REVIEW_STATUS: Record<string, { pill: string; dot: string }> = {
  pending:      { pill: "bg-navy-100 text-navy-500 border border-navy-200",       dot: "bg-navy-400" },
  in_progress:  { pill: "bg-amber-50 text-amber-700 border border-amber-200",     dot: "bg-amber-400" },
  submitted:    { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  acknowledged: { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-navy-400 text-xs">Not rated</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-4 w-4 ${i <= rating ? "text-amber-400" : "text-navy-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function PerformanceCycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("performance_cycles")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!cycle) notFound();

  const { data: reviews } = await supabase
    .from("performance_reviews")
    .select("*")
    .eq("cycle_id", id)
    .order("created_at");

  const allReviews = reviews ?? [];
  const empIds = [...new Set(allReviews.map((r) => r.employee_id))];
  const reviewerIds = [...new Set(allReviews.map((r) => r.reviewer_id).filter(Boolean) as string[])];
  const allEmpIds = [...new Set([...empIds, ...reviewerIds])];

  const { data: employees } = allEmpIds.length
    ? await supabase.from("employees").select("id, full_name, job_title, department").in("id", allEmpIds)
    : { data: [] };

  const empMap = Object.fromEntries((employees ?? []).map((e) => [e.id, e]));

  const sv = STATUS_VISUAL[cycle.status] ?? STATUS_VISUAL.draft;
  const periodStart = new Date(cycle.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const periodEnd   = new Date(cycle.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const submitted = allReviews.filter((r) => r.status === "submitted" || r.status === "acknowledged").length;
  const pending   = allReviews.filter((r) => r.status === "pending").length;
  const avgRating = allReviews.filter((r) => r.rating !== null).reduce((s, r, _, arr) => s + (r.rating ?? 0) / arr.length, 0);
  const ratedCount = allReviews.filter((r) => r.rating !== null).length;
  const completionPct = allReviews.length > 0 ? Math.round((submitted / allReviews.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/performance" className="hover:text-white transition-colors">Performance</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{cycle.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{cycle.name}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {cycle.status}
                </span>
              </div>
              <p className="text-blue-300 text-sm mt-1 font-mono">{periodStart} – {periodEnd}</p>
            </div>
            <div className="flex gap-5 shrink-0">
              {[
                { label: "Reviews",    value: allReviews.length, color: "text-white" },
                { label: "Submitted",  value: submitted,         color: "text-blue-300" },
                { label: "Avg rating", value: ratedCount > 0 ? avgRating.toFixed(1) : "—", color: "text-amber-300" },
              ].map((s) => (
                <div key={s.label} className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{s.label}</p>
                  <p className={`font-mono text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Completion bar */}
          {allReviews.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-400 mb-1.5">
                <span>Completion</span>
                <span>{submitted}/{allReviews.length} submitted · {completionPct}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <CompletionBar pct={completionPct} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin actions */}
      {orgCtx.isAdmin && cycle.status === "active" && (
        <div className="bg-white rounded-2xl border border-navy-200 p-4 mb-6 flex items-center justify-between shadow-sm">
          <p className="text-sm text-navy-600 font-medium">
            {pending > 0 ? `${pending} review${pending !== 1 ? "s" : ""} still pending` : "All reviews submitted."}
          </p>
          <CycleActions cycleId={cycle.id} pendingCount={pending} />
        </div>
      )}

      {/* Reviews table */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-navy-200 bg-navy-50/80 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Reviews</h2>
          <span className="text-xs font-bold text-navy-500 bg-navy-100 border border-navy-200 rounded-full px-2.5 py-1">
            {allReviews.length}
          </span>
        </div>
        {allReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/40 border-b border-navy-100 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-3">Employee</div>
              <div className="col-span-3 hidden sm:block">Reviewer</div>
              <div className="col-span-3">Rating</div>
              <div className="col-span-3">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allReviews.map((review) => {
                const emp = empMap[review.employee_id];
                const reviewer = review.reviewer_id ? empMap[review.reviewer_id] : null;
                const rvSv = REVIEW_STATUS[review.status] ?? REVIEW_STATUS.pending;
                return (
                  <div key={review.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-navy-50/40 transition-colors">
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate">{emp?.full_name ?? "—"}</p>
                      <p className="text-xs text-navy-400 truncate">{emp?.job_title ?? ""}</p>
                    </div>
                    <div className="col-span-3 hidden sm:block text-sm text-navy-600 truncate">
                      {reviewer?.full_name ?? <span className="text-navy-300 italic">Unassigned</span>}
                    </div>
                    <div className="col-span-3">
                      <StarRating rating={review.rating} />
                    </div>
                    <div className="col-span-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${rvSv.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rvSv.dot}`} />
                        {rvSv.pill.includes("amber") ? "In progress" : review.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-sm text-navy-400">
            No reviews in this cycle yet.
          </div>
        )}
      </div>
    </div>
  );
}
