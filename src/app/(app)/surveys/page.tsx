import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Surveys | Atlas HR" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  draft:  { pill: "bg-navy-100 text-navy-600 border border-navy-200",       dot: "bg-navy-400" },
  active: { pill: "bg-blue-50 text-blue-700 border border-blue-200",        dot: "bg-blue-500" },
  closed: { pill: "bg-slate-100 text-slate-500 border border-slate-200",    dot: "bg-slate-400" },
};

const TYPE_STYLE: Record<string, string> = {
  enps:   "bg-violet-50 text-violet-700 border border-violet-200",
  pulse:  "bg-blue-50 text-blue-700 border border-blue-200",
  custom: "bg-navy-50 text-navy-600 border border-navy-200",
};

const typeLabels: Record<string, string> = { enps: "eNPS", pulse: "Pulse", custom: "Custom" };

export default async function SurveysPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .order("created_at", { ascending: false });

  const allSurveys = surveys ?? [];

  const surveyIds = allSurveys.map((s) => s.id);
  const { data: responses } = surveyIds.length
    ? await supabase.from("survey_responses").select("survey_id").in("survey_id", surveyIds)
    : { data: [] };

  const responseCountMap: Record<string, number> = {};
  for (const r of responses ?? []) {
    responseCountMap[r.survey_id] = (responseCountMap[r.survey_id] ?? 0) + 1;
  }

  const active = allSurveys.filter((s) => s.status === "active").length;
  const closed = allSurveys.filter((s) => s.status === "closed").length;
  const totalResponses = responses?.length ?? 0;

  const kpis = [
    { label: "Total surveys",    value: allSurveys.length, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { label: "Active",           value: active,            strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Closed",           value: closed,            strip: "from-slate-400 to-slate-500",  grad: "from-slate-500 to-slate-600",  icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
    { label: "Total responses",  value: totalResponses,    strip: "from-violet-400 to-purple-500",grad: "from-violet-500 to-purple-600",icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Surveys</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name}
                {active > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-400/30">
                    {active} active
                  </span>
                )}
              </p>
            </div>
          </div>
          {orgCtx.isAdmin && (
            <Link href="/surveys/new"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New survey
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
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Surveys list */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {allSurveys.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-5">Survey</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 hidden sm:block">Responses</div>
              <div className="col-span-5 sm:col-span-3">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allSurveys.map((survey) => {
                const sv = STATUS_VISUAL[survey.status] ?? STATUS_VISUAL.draft;
                const ts = TYPE_STYLE[survey.type] ?? TYPE_STYLE.custom;
                const responseCount = responseCountMap[survey.id] ?? 0;
                const questionsArr = Array.isArray(survey.questions) ? survey.questions : [];
                const createdAt = new Date(survey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

                return (
                  <Link key={survey.id} href={`/surveys/${survey.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-blue-50/30 transition-colors group"
                  >
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate group-hover:text-blue-700 transition-colors">{survey.title}</p>
                      <p className="text-xs text-navy-400 font-mono mt-0.5">
                        {questionsArr.length} question{questionsArr.length !== 1 ? "s" : ""} · {createdAt}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${ts}`}>
                        {typeLabels[survey.type] ?? survey.type}
                      </span>
                    </div>
                    <div className="col-span-2 hidden sm:block text-sm font-bold text-navy-700 font-mono">
                      {responseCount}
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                        {survey.status}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No surveys yet</h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">Create your first survey to start collecting employee feedback.</p>
            {orgCtx.isAdmin && (
              <Link href="/surveys/new"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New survey
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
