import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SurveyActions } from "./survey-actions";
import { NpsSegment, RatingBarFill } from "./survey-bars";
import type { Metadata } from "next";
import type { Json } from "@/types/database";

export const metadata: Metadata = { title: "Survey" };

type SurveyQuestion = { id: string; text: string; type: "rating" | "text" | "nps" };

function parseQuestions(raw: Json): SurveyQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((q): q is SurveyQuestion =>
    typeof q === "object" && q !== null && "id" in q && "text" in q
  );
}

function parseResponses(raw: Json): Record<string, string | number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, string | number>;
}

const STATUS_VISUAL: Record<string, { pill: string; dot: string }> = {
  draft:  { pill: "bg-navy-100 text-navy-600 border border-navy-200",  dot: "bg-navy-400" },
  active: { pill: "bg-blue-50 text-blue-700 border border-blue-200",   dot: "bg-blue-500" },
  closed: { pill: "bg-slate-100 text-slate-500 border border-slate-200", dot: "bg-slate-400" },
};

function NpsScore({ scores }: { scores: number[] }) {
  if (scores.length === 0) return <p className="text-navy-400 text-sm">No responses yet</p>;
  const promoters  = scores.filter((s) => s >= 9).length;
  const passives   = scores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const nps = Math.round(((promoters - detractors) / scores.length) * 100);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const promPct = (promoters  / scores.length) * 100;
  const passPct = (passives   / scores.length) * 100;
  const detPct  = (detractors / scores.length) * 100;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8">
        <div>
          <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">eNPS score</p>
          <p className={`text-4xl font-bold ${nps >= 0 ? "text-blue-700" : "text-red-600"}`}>{nps > 0 ? "+" : ""}{nps}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">Avg score</p>
          <p className="text-4xl font-bold text-navy-800">{avg.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">Responses</p>
          <p className="text-4xl font-bold text-navy-800">{scores.length}</p>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-navy-600">Promoters (9–10): {promoters}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-navy-600">Passives (7–8): {passives}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="text-navy-600">Detractors (0–6): {detractors}</span>
        </div>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden">
        {promPct > 0 && <NpsSegment pct={promPct} color="bg-blue-500" />}
        {passPct > 0 && <NpsSegment pct={passPct} color="bg-amber-400" />}
        {detPct  > 0 && <NpsSegment pct={detPct}  color="bg-red-400"  />}
      </div>
    </div>
  );
}

function RatingDistribution({ values }: { values: number[] }) {
  if (values.length === 0) return <p className="text-navy-400 text-sm">No responses yet</p>;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...[1, 2, 3, 4, 5].map((r) => values.filter((v) => v === r).length), 1);
  return (
    <div className="space-y-2">
      <p className="text-sm text-navy-600 mb-3">
        Average: <strong className="text-amber-600">{avg.toFixed(1)} / 5</strong> · {values.length} response{values.length !== 1 ? "s" : ""}
      </p>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = values.filter((v) => v === star).length;
        const pct = max > 0 ? (count / max) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs font-medium text-navy-600 w-4">{star}★</span>
            <div className="flex-1 bg-navy-100 rounded-full h-2 overflow-hidden">
              <RatingBarFill pct={pct} />
            </div>
            <span className="text-xs text-navy-500 w-4 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!survey) notFound();

  const { data: responses } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", id)
    .order("submitted_at", { ascending: false });

  const allResponses = responses ?? [];
  const questions    = parseQuestions(survey.questions);
  const sv           = STATUS_VISUAL[survey.status] ?? STATUS_VISUAL.draft;
  const createdAt    = new Date(survey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function getAnswers(questionId: string): (string | number)[] {
    return allResponses
      .map((r) => parseResponses(r.responses)[questionId])
      .filter((v) => v !== undefined && v !== null && v !== "");
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/surveys" className="hover:text-white transition-colors">Surveys</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{survey.title}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{survey.title}</h1>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sv.dot}`} />
                  {survey.status}
                </span>
              </div>
              <p className="text-blue-300 text-sm font-mono">Created {createdAt}</p>
              {survey.ends_at && (
                <p className="text-blue-400 text-xs mt-0.5 font-mono">
                  Closes {new Date(survey.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Responses</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{allResponses.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Questions</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{questions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions */}
      {orgCtx.isAdmin && survey.status === "active" && (
        <div className="bg-white rounded-2xl border border-navy-200 p-4 mb-6 shadow-sm">
          <SurveyActions surveyId={survey.id} />
        </div>
      )}

      {/* Results */}
      <div className="space-y-5">
        {questions.map((q) => {
          const answers = getAnswers(q.id);
          return (
            <div key={q.id} className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
              <p className="font-bold text-navy-900 mb-4">{q.text}</p>
              {q.type === "nps" ? (
                <NpsScore scores={answers.map(Number).filter((n) => !isNaN(n))} />
              ) : q.type === "rating" ? (
                <RatingDistribution values={answers.map(Number).filter((n) => !isNaN(n))} />
              ) : (
                <div className="space-y-2">
                  {answers.length > 0 ? (
                    answers.map((a, i) => (
                      <div key={i} className="text-sm text-navy-700 bg-navy-50 rounded-xl px-4 py-2.5">
                        {String(a)}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-navy-400">No text responses yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="bg-white rounded-2xl border border-navy-200 p-8 text-center text-sm text-navy-400">
            No questions configured for this survey.
          </div>
        )}
      </div>
    </div>
  );
}
