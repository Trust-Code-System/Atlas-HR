"use client";

import {
  useActionState,
  useTransition,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  addApplication,
  moveApplicationStage,
  updateJobStatus,
  updateApplicationNotes,
  convertToEmployee,
} from "../actions";
import type { RecruitingActionResult } from "../actions";
import type { Job, JobApplication } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STAGES = [
  { key: "applied",    label: "Applied" },
  { key: "screening",  label: "Screening" },
  { key: "interview",  label: "Interview" },
  { key: "offer",      label: "Offer" },
  { key: "hired",      label: "Hired" },
  { key: "rejected",   label: "Rejected" },
];

const stageColors: Record<string, string> = {
  applied:   "bg-navy-100 text-navy-700",
  screening: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-700",
  offer:     "bg-purple-100 text-purple-700",
  hired:     "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-700",
};

const stageHeaderColors: Record<string, string> = {
  applied:   "border-navy-300 bg-navy-50",
  screening: "border-blue-300 bg-blue-50",
  interview: "border-amber-300 bg-amber-50",
  offer:     "border-purple-300 bg-purple-50",
  hired:     "border-emerald-300 bg-emerald-50",
  rejected:  "border-red-300 bg-red-50",
};

const SOURCE_LABELS: Record<string, string> = {
  linkedin:     "LinkedIn",
  indeed:       "Indeed",
  referral:     "Referral",
  careers_page: "Careers page",
  glassdoor:    "Glassdoor",
  agency:       "Agency",
  direct:       "Direct",
  other:        "Other",
};

const SOURCES = [
  { value: "linkedin",     label: "LinkedIn" },
  { value: "indeed",       label: "Indeed" },
  { value: "referral",     label: "Referral" },
  { value: "careers_page", label: "Careers page" },
  { value: "glassdoor",    label: "Glassdoor" },
  { value: "agency",       label: "Agency" },
  { value: "direct",       label: "Direct" },
  { value: "other",        label: "Other" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract",  label: "Contract" },
  { value: "intern",    label: "Intern" },
];

interface Props {
  job: Job;
  applications: JobApplication[];
  isAdmin: boolean;
}

// ── Add candidate modal ────────────────────────────────────────────────────

function AddCandidateModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<RecruitingActionResult, FormData>(
    addApplication,
    null
  );
  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold text-navy-900 mb-4">Add candidate</h2>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="job_id" value={jobId} />
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}
          <div>
            <label htmlFor="add_name" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <Input id="add_name" name="candidate_name" placeholder="Full name" required />
          </div>
          <div>
            <label htmlFor="add_email" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Email</label>
            <Input id="add_email" name="candidate_email" type="email" placeholder="email@example.com" />
          </div>
          <div>
            <label htmlFor="add_phone" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Phone</label>
            <Input id="add_phone" name="candidate_phone" placeholder="+44 7000 000000" />
          </div>
          <div>
            <label htmlFor="add_source" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Source</label>
            <select
              id="add_source"
              name="source"
              className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select source…</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add_linkedin" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">LinkedIn profile URL</label>
            <Input id="add_linkedin" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/username" />
          </div>
          <div>
            <label htmlFor="add_notes" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea
              id="add_notes"
              name="notes"
              className="flex min-h-[80px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              placeholder="Any initial notes…"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" loading={isPending}>Add candidate</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Convert to employee form ───────────────────────────────────────────────

function ConvertToEmployeeForm({
  app,
  job,
  onClose,
  onSuccess,
}: {
  app: JobApplication;
  job: Job;
  onClose: () => void;
  onSuccess: (employeeId: string) => void;
}) {
  const [state, formAction, isPending] = useActionState<RecruitingActionResult, FormData>(
    convertToEmployee,
    null
  );

  useEffect(() => {
    if (state?.success && state.id) onSuccess(state.id);
  }, [state, onSuccess]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">Convert to employee</h2>
            <p className="text-xs text-slate-400">{app.candidate_name}</p>
          </div>
        </div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="application_id" value={app.id} />
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {state.error}
            </div>
          )}
          <div>
            <label htmlFor="conv_start" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              id="conv_start"
              type="date"
              name="start_date"
              required
              className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="conv_title" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Job title</label>
            <Input id="conv_title" name="job_title" defaultValue={job.title} placeholder="e.g. Senior Engineer" />
          </div>
          <div>
            <label htmlFor="conv_dept" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Department</label>
            <Input id="conv_dept" name="department" defaultValue={job.department ?? ""} placeholder="e.g. Engineering" />
          </div>
          <div>
            <label htmlFor="conv_type" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Employment type</label>
            <select
              id="conv_type"
              name="employment_type"
              defaultValue={job.employment_type ?? "full_time"}
              className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="conv_salary" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Annual salary (optional)</label>
            <Input id="conv_salary" name="salary" type="number" placeholder="e.g. 55000" min="0" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" loading={isPending} className="bg-emerald-600 hover:bg-emerald-700">
              Create employee record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Candidate drawer ───────────────────────────────────────────────────────

function CandidateDrawer({
  app,
  job,
  isAdmin,
  onClose,
}: {
  app: JobApplication;
  job: Job;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [stage, setStage] = useState(app.stage ?? "applied");
  const [notes, setNotes] = useState(app.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [notesSaving, startNotesSave] = useTransition();
  const [stagePending, startStageTransition] = useTransition();
  const [showConvert, setShowConvert] = useState(false);
  const [converted, setConverted] = useState<string | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<string | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  async function runFitCheck() {
    setFitLoading(true);
    setFitAnalysis(null);
    try {
      const res = await fetch("/api/recruiting/fit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id }),
      });
      const data = await res.json();
      setFitAnalysis(data.analysis ?? data.error ?? "No response.");
    } catch {
      setFitAnalysis("Failed to run analysis. Please try again.");
    } finally {
      setFitLoading(false);
    }
  }

  function handleStageChange(next: JobApplication["stage"]) {
    setStage(next);
    startStageTransition(async () => {
      await moveApplicationStage(app.id, next);
    });
  }

  function saveNotes() {
    startNotesSave(async () => {
      await updateApplicationNotes(app.id, notes);
      setNotesDirty(false);
    });
  }

  const formattedDate = new Date(app.applied_at ?? app.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-navy-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-navy-900 truncate">{app.candidate_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageColors[stage] ?? stageColors.applied}`}>
                {STAGES.find((s) => s.key === stage)?.label ?? stage}
              </span>
              {app.source && (
                <span className="text-[11px] text-slate-400 font-medium">
                  via {SOURCE_LABELS[app.source] ?? app.source}
                </span>
              )}
              <span className="text-[11px] text-slate-400">{formattedDate}</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-navy-900 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Convert success banner */}
          {converted && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Employee record created</p>
                <a href={`/org/people/${converted}`} className="text-xs text-emerald-700 underline">View employee profile →</a>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="rounded-[14px] border border-navy-100 bg-navy-50/50 divide-y divide-navy-100">
            {[
              { label: "Email", value: app.candidate_email, href: app.candidate_email ? `mailto:${app.candidate_email}` : undefined },
              { label: "Phone", value: app.candidate_phone, href: app.candidate_phone ? `tel:${app.candidate_phone}` : undefined },
              { label: "Source", value: app.source ? SOURCE_LABELS[app.source] : null },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { label: "LinkedIn", value: (app as any).linkedin_url as string | null, href: (app as any).linkedin_url as string | undefined },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-16 shrink-0 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{row.label}</span>
                {row.value ? (
                  row.href ? (
                    <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{row.value}</a>
                  ) : (
                    <span className="text-sm text-navy-900">{row.value}</span>
                  )
                ) : (
                  <span className="text-sm text-slate-300">—</span>
                )}
              </div>
            ))}
          </div>

          {/* AI Fit Check */}
          {isAdmin && (
            <div className="rounded-[14px] border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-900">AI Fit Check</p>
                </div>
                <button
                  type="button"
                  onClick={runFitCheck}
                  disabled={fitLoading}
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {fitLoading ? "Analysing…" : fitAnalysis ? "Re-run" : "Analyse candidate"}
                </button>
              </div>
              {fitLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Running analysis…
                </div>
              )}
              {fitAnalysis && !fitLoading && (
                <div className="text-xs text-navy-700 whitespace-pre-wrap leading-relaxed">{fitAnalysis}</div>
              )}
              {!fitAnalysis && !fitLoading && (
                <p className="text-xs text-blue-600">Click &ldquo;Analyse candidate&rdquo; to get an AI assessment of this candidate&apos;s fit for the role.</p>
              )}
            </div>
          )}

          {/* Stage selector */}
          {isAdmin && (
            <div>
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">Stage</p>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={stagePending}
                    onClick={() => handleStageChange(s.key as JobApplication["stage"])}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${
                      stage === s.key
                        ? `${stageColors[s.key]} ring-2 ring-offset-1 ring-current`
                        : "bg-navy-100 text-navy-500 hover:bg-navy-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
              disabled={!isAdmin}
              rows={5}
              placeholder={isAdmin ? "Add recruiter notes…" : "No notes"}
              className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none disabled:bg-navy-50 disabled:text-navy-500"
            />
            {isAdmin && notesDirty && (
              <button
                type="button"
                disabled={notesSaving}
                onClick={saveNotes}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {notesSaving ? "Saving…" : "Save notes"}
              </button>
            )}
          </div>

          {/* Convert to employee */}
          {isAdmin && stage === "hired" && !converted && (
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Ready to onboard</p>
                  <p className="text-xs text-emerald-600">Create an employee record for this candidate.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConvert(true)}
                className="w-full rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 hover:bg-emerald-700 transition-colors"
              >
                Convert to employee →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Convert modal (stacked above drawer) */}
      {showConvert && (
        <ConvertToEmployeeForm
          app={app}
          job={job}
          onClose={() => setShowConvert(false)}
          onSuccess={(id) => { setConverted(id); setShowConvert(false); }}
        />
      )}
    </>
  );
}

// ── Job status control ─────────────────────────────────────────────────────

function JobStatusControl({ job }: { job: Job }) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(job.status);

  const STATUSES: Array<{ value: "open" | "on_hold" | "closed" | "draft"; label: string; color: string }> = [
    { value: "open",    label: "Open",    color: "text-blue-700 bg-blue-50 border-blue-200" },
    { value: "on_hold", label: "On hold", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "closed",  label: "Closed",  color: "text-slate-600 bg-slate-50 border-slate-200" },
  ];

  function handleChange(next: "open" | "on_hold" | "closed" | "draft") {
    setCurrent(next);
    startTransition(async () => { await updateJobStatus(job.id, next); });
  }

  return (
    <div className="flex items-center gap-2">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(s.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-50 ${
            current === s.value
              ? `${s.color} ring-2 ring-offset-1 ring-current`
              : "bg-white text-navy-400 border-navy-200 hover:border-navy-300"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function RecruitingClient({ job, applications, isAdmin }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<JobApplication | null>(null);

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.key, applications.filter((a) => a.stage === s.key)])
  );

  return (
    <>
      {showAddModal && isAdmin && (
        <AddCandidateModal jobId={job.id} onClose={() => setShowAddModal(false)} />
      )}

      {activeCandidate && (
        <CandidateDrawer
          app={activeCandidate}
          job={job}
          isAdmin={isAdmin}
          onClose={() => setActiveCandidate(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isAdmin && (
          <>
            {job.status !== "closed" && (
              <Button type="button" onClick={() => setShowAddModal(true)}>
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add candidate
              </Button>
            )}
            <div className="flex-1" />
            <JobStatusControl job={job} />
          </>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = byStage[stage.key] ?? [];
          return (
            <div key={stage.key} className="shrink-0 w-64">
              <div className={`rounded-t-xl border-t border-x px-3 py-2.5 flex items-center justify-between ${stageHeaderColors[stage.key]}`}>
                <span className="text-xs font-bold uppercase tracking-wide text-navy-700">{stage.label}</span>
                <span className="text-xs font-semibold text-navy-500 bg-white/70 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="rounded-b-xl border border-navy-200 border-t-0 bg-navy-50/40 min-h-[400px] p-2 space-y-2">
                {cards.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setActiveCandidate(app)}
                    className="w-full text-left bg-white rounded-xl border border-navy-200 p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                  >
                    <p className="text-sm font-semibold text-navy-900 mb-0.5 group-hover:text-blue-700 transition-colors">
                      {app.candidate_name}
                    </p>
                    {app.candidate_email && (
                      <p className="text-xs text-navy-400 truncate mb-1">{app.candidate_email}</p>
                    )}
                    {app.source && (
                      <p className="text-[11px] text-slate-400 mb-1">
                        via {SOURCE_LABELS[app.source] ?? app.source}
                      </p>
                    )}
                    {app.notes && (
                      <p className="text-xs text-navy-500 line-clamp-2 mb-2">{app.notes}</p>
                    )}
                    <p className="text-xs text-navy-400">
                      {new Date(app.applied_at ?? app.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </button>
                ))}
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-navy-400">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
