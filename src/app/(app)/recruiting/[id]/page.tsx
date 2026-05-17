import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { RecruitingClient } from "./recruiting-client";
import type { Metadata } from "next";

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  open:    { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  draft:   { pill: "bg-navy-100 text-navy-600 border border-navy-200",       dot: "bg-navy-400" },
  on_hold: { pill: "bg-amber-50 text-amber-700 border border-amber-200",     dot: "bg-amber-400" },
  closed:  { pill: "bg-slate-100 text-slate-500 border border-slate-200",    dot: "bg-slate-400" },
};

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

export const metadata: Metadata = { title: "Job Detail" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) notFound();

  const { data: applications } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: true });

  const allApps = applications ?? [];
  const sv = STATUS_VISUAL[job.status] ?? STATUS_VISUAL.draft;
  const hired = allApps.filter((a) => a.stage === "hired").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/recruiting" className="hover:text-white transition-colors">Recruiting</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{job.title}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{job.title}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {job.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-300">
                {job.department && <span>{job.department}</span>}
                {job.location && <><span className="text-blue-500">·</span><span>{job.location}</span></>}
                {job.employment_type && <><span className="text-blue-500">·</span><span>{typeLabels[job.employment_type] ?? job.employment_type}</span></>}
              </div>
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Applicants</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{allApps.length}</p>
              </div>
              {hired > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Hired</p>
                  <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{hired}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job description card */}
      {(job.description || job.requirements) && (
        <div className="bg-white rounded-2xl border border-navy-200 p-6 mb-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-6">
            {job.description && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-2">Description</p>
                <p className="text-sm text-navy-700 whitespace-pre-line leading-relaxed">{job.description}</p>
              </div>
            )}
            {job.requirements && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-2">Requirements</p>
                <p className="text-sm text-navy-700 whitespace-pre-line leading-relaxed">{job.requirements}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban pipeline */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-navy-900">Candidate Pipeline</h2>
        <span className="text-sm text-navy-500 font-mono">{allApps.length} total</span>
      </div>

      <RecruitingClient job={job} applications={allApps} isAdmin={orgCtx.isAdmin} />
    </div>
  );
}
