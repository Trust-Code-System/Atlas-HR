"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { AiSummaryButton } from "@/components/ai/ai-summary-button";
import { fileComplaint, updateComplaint, type ComplaintActionResult } from "./actions";
import type { Complaint } from "@/types/database";

interface EmployeeOpt { id: string; full_name: string; department: string | null }

interface Props {
  complaints: Complaint[];
  employees: EmployeeOpt[];
  empMap: Record<string, string>;
  isAdmin: boolean;
  isOwner: boolean;
  currentUserId: string;
}

const CATEGORIES = [
  { value: "harassment", label: "Harassment" },
  { value: "discrimination", label: "Discrimination" },
  { value: "bullying", label: "Bullying" },
  { value: "safety", label: "Health & Safety" },
  { value: "pay", label: "Pay & Benefits" },
  { value: "management", label: "Management" },
  { value: "policy", label: "Policy" },
  { value: "interpersonal", label: "Interpersonal" },
  { value: "other", label: "Other" },
];
const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
const STATUSES = [
  { value: "new", label: "New" },
  { value: "triaging", label: "Triaging" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "closed", label: "Closed" },
];

const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;
const sevStyle: Record<string, string> = {
  low: "bg-navy-100 text-navy-600", medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700", critical: "bg-red-50 text-red-700",
};
const statusStyle: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  triaging: "bg-violet-50 text-violet-700 border-violet-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dismissed: "bg-navy-50 text-navy-500 border-navy-200",
  closed: "bg-navy-50 text-navy-500 border-navy-200",
};

export function ComplaintsClient({ complaints, employees, empMap, isAdmin, isOwner, currentUserId }: Props) {
  const [showRaise, setShowRaise] = useState(false);

  const open = complaints.filter((c) => !["resolved", "dismissed", "closed"].includes(c.status));
  const closed = complaints.filter((c) => ["resolved", "dismissed", "closed"].includes(c.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-navy-500">
          {complaints.length === 0 ? "No cases visible to you." : `${open.length} open · ${closed.length} closed`}
        </p>
        <button
          type="button"
          onClick={() => setShowRaise(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Raise a concern
        </button>
      </div>

      {showRaise && <RaiseModal employees={employees} isAdmin={isAdmin} onClose={() => setShowRaise(false)} />}

      {open.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">Open cases ({open.length})</h2>
          <div className="space-y-3">
            {open.map((c) => (
              <CaseCard key={c.id} c={c} empMap={empMap} employees={employees} isAdmin={isAdmin} isOwner={isOwner} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">Closed ({closed.length})</h2>
          <div className="space-y-3">
            {closed.map((c) => (
              <CaseCard key={c.id} c={c} empMap={empMap} employees={employees} isAdmin={isAdmin} isOwner={isOwner} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}

      {complaints.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-200 text-center py-16 text-sm text-navy-400">
          Nothing here yet. Use “Raise a concern” to submit a confidential report.
        </div>
      )}
    </div>
  );
}

function RaiseModal({ employees, isAdmin, onClose }: { employees: EmployeeOpt[]; isAdmin: boolean; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ComplaintActionResult, FormData>(fileComplaint, null);
  const [anonymous, setAnonymous] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [subject, setSubject] = useState("");

  useEffect(() => { if (state?.success) onClose(); }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-900 text-lg">Raise a concern</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}
          <p className="text-xs text-navy-500">Your report goes to HR. It is handled confidentially; mark it sensitive to restrict it to workspace owners only.</p>

          <div>
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Title <span className="text-red-500">*</span></label>
            <input name="title" required maxLength={200} className="flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Short summary of the concern" />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">What happened? <span className="text-red-500">*</span></label>
            <textarea name="description" required className="flex min-h-32 w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y" placeholder="Describe what happened, when, who was involved, and any witnesses…" />
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Person this concerns (optional)</label>
              <input type="hidden" name="subject_employee_id" value={subject} />
              <Select
                aria-label="Subject employee"
                value={subject}
                onChange={setSubject}
                options={[{ value: "", label: "Not specified" }, ...employees.map((e) => ({ value: e.id, label: e.full_name }))]}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="hidden" name="is_anonymous" value={anonymous ? "true" : "false"} />
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600" />
              <span className="text-sm text-navy-700">Keep my report anonymous (hide my identity from handlers)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="hidden" name="is_sensitive" value={sensitive ? "true" : "false"} />
              <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600" />
              <span className="text-sm text-navy-700">This is sensitive — restrict to workspace owners</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {isPending ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Suggestion { category: string; severity: string; is_sensitive: boolean; summary: string; rationale: string }

function CaseCard({
  c, empMap, employees, isAdmin, isOwner, currentUserId,
}: {
  c: Complaint;
  empMap: Record<string, string>;
  employees: EmployeeOpt[];
  isAdmin: boolean;
  isOwner: boolean;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resolution, setResolution] = useState(c.resolution ?? "");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const assignedToMe = c.assigned_to === currentUserId;
  const canManage = assignedToMe || isOwner || (isAdmin && !c.is_sensitive);

  function patch(p: Parameters<typeof updateComplaint>[1]) {
    startTransition(async () => {
      const res = await updateComplaint(c.id, p);
      if (res?.error) setErr(res.error);
    });
  }

  async function classify() {
    setClassifying(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/complaint-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: c.title, description: c.description }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? "Couldn't classify."); return; }
      setSuggestion(data);
    } catch {
      setErr("Something went wrong classifying.");
    } finally {
      setClassifying(false);
    }
  }

  const reporterLabel = c.is_anonymous
    ? "Anonymous"
    : c.reporter_employee_id
      ? empMap[c.reporter_employee_id] ?? "Reporter"
      : "Reporter";
  const subjectLabel = c.subject_employee_id ? empMap[c.subject_employee_id] ?? "—" : null;

  return (
    <div className={`bg-white rounded-2xl border ${c.is_sensitive ? "border-red-200" : "border-navy-200"} shadow-sm overflow-hidden ${pending ? "opacity-70" : ""}`}>
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-navy-50/40 transition-colors">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-navy-900">{c.title}</p>
            {c.is_sensitive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-700 rounded-full px-2 py-0.5 ring-1 ring-red-200">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Sensitive
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${statusStyle[c.status]}`}>{c.status}</span>
            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${sevStyle[c.severity]}`}>{c.severity}</span>
            <span className="text-[10px] font-semibold bg-navy-100 text-navy-500 rounded-full px-2 py-0.5">{catLabel(c.category)}</span>
            <span className="text-[11px] text-navy-400">{new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <svg className={`h-4 w-4 text-navy-400 shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-navy-50 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 pt-4 text-sm">
            <div><span className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block">Reporter</span><span className="text-navy-700">{reporterLabel}</span></div>
            {subjectLabel && <div><span className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block">Concerns</span><span className="text-navy-700">{subjectLabel}</span></div>}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Description</span>
            <p className="text-sm text-navy-700 whitespace-pre-wrap leading-relaxed">{c.description}</p>
          </div>

          {err && <p className="text-xs text-red-600">{err}</p>}

          {canManage ? (
            <div className="space-y-4 rounded-xl bg-navy-50/50 border border-navy-100 p-4">
              {/* Triage controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Status</label>
                  <Select aria-label="Status" value={c.status} onChange={(v) => patch({ status: v })} triggerClassName="h-9 text-sm" options={STATUSES} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Severity</label>
                  <Select aria-label="Severity" value={c.severity} onChange={(v) => patch({ severity: v })} triggerClassName="h-9 text-sm" options={SEVERITIES} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Category</label>
                  <Select aria-label="Category" value={c.category} onChange={(v) => patch({ category: v })} triggerClassName="h-9 text-sm" options={CATEGORIES} />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {assignedToMe ? (
                  <button type="button" disabled={pending} onClick={() => patch({ assigned_to: null })} className="text-xs font-semibold text-navy-600 bg-white border border-navy-200 hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">Unassign me</button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => patch({ assigned_to: currentUserId })} className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">Assign to me</button>
                )}
                {(isAdmin || isOwner) && (
                  <button type="button" disabled={pending} onClick={() => patch({ is_sensitive: !c.is_sensitive })} className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {c.is_sensitive ? "Remove sensitive" : "Mark sensitive"}
                  </button>
                )}
                <button type="button" disabled={classifying} onClick={() => void classify()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {classifying ? (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  )}
                  AI classify
                </button>
              </div>

              {suggestion && (
                <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-sm">
                  <p className="text-xs font-semibold text-violet-800 mb-1">AI suggestion</p>
                  <p className="text-navy-700"><strong>{catLabel(suggestion.category)}</strong> · {suggestion.severity}{suggestion.is_sensitive ? " · sensitive" : ""}</p>
                  <p className="text-navy-600 mt-1">{suggestion.summary}</p>
                  <p className="text-[11px] text-navy-400 mt-1 italic">{suggestion.rationale}</p>
                  <button type="button" disabled={pending} onClick={() => { patch({ category: suggestion.category, severity: suggestion.severity, is_sensitive: suggestion.is_sensitive }); setSuggestion(null); }} className="mt-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    Apply suggestion
                  </button>
                </div>
              )}

              {/* Neutral communications drafting */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1.5">Draft neutral communication</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {([
                    { audience: "reporter", label: "To reporter" },
                    { audience: "subject", label: "To subject" },
                    { audience: "manager", label: "To manager" },
                    { audience: "summary", label: "File note" },
                  ] as const).map((a) => (
                    <AiSummaryButton
                      key={a.audience}
                      endpoint={`/api/ai/complaint-comms?id=${c.id}&audience=${a.audience}`}
                      title={`Draft — ${a.label}`}
                      subtitle={c.title}
                      buttonLabel={a.label}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 bg-white border border-navy-200 hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors"
                    />
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Resolution / outcome</label>
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} className="flex min-h-20 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y" placeholder="Record the outcome or actions taken…" />
                <button type="button" disabled={pending} onClick={() => patch({ resolution })} className="mt-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">Save resolution</button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-navy-50/50 border border-navy-100 p-3 text-sm text-navy-500">
              {c.resolution ? (
                <><span className="text-[10px] font-bold uppercase tracking-wide text-navy-400 block mb-1">Outcome</span>{c.resolution}</>
              ) : (
                "This case is being handled by HR. You'll be updated on its progress."
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
