"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import type { JobReferral, Job, Employee } from "@/types/database";
import { submitReferral, updateReferralStatus, deleteReferral } from "./actions";
import type { ReferralActionResult } from "./actions";
import { Select } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobRow = Pick<Job, "id" | "title" | "department" | "location" | "status">;
type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  referrals: JobReferral[];
  jobs: JobRow[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = {
  pending:      { label: "Pending",      cls: "bg-navy-100 text-navy-600",    step: 1 },
  reviewing:    { label: "Reviewing",    cls: "bg-blue-100 text-blue-700",    step: 2 },
  interviewing: { label: "Interviewing", cls: "bg-amber-100 text-amber-700",  step: 3 },
  hired:        { label: "Hired",        cls: "bg-green-100 text-green-700",  step: 4 },
  rejected:     { label: "Rejected",     cls: "bg-red-100 text-red-600",      step: 0 },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Submit Referral Modal ────────────────────────────────────────────────────

function SubmitReferralModal({
  jobs,
  employees,
  onClose,
}: {
  jobs: JobRow[];
  employees: EmployeeRow[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ReferralActionResult, FormData>(submitReferral, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Submit a referral</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-navy-400 hover:text-navy-700 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{state.error}</div>
          )}

          <div>
            <label htmlFor="ref-job" className={labelCls}>Open role <span className="text-red-500">*</span></label>
            <Select
              id="ref-job"
              name="job_id"
              required
              options={[
                { value: "", label: "Select a role..." },
                ...jobs.map((j) => ({
                  value: j.id,
                  label: `${j.title}${j.department ? ` - ${j.department}` : ""}`,
                })),
              ]}
            />
            <select id="ref-job-native" aria-hidden="true" disabled className="hidden">
              <option value="">Select a role…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}{j.department ? ` — ${j.department}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ref-referrer" className={labelCls}>Referring employee <span className="text-red-500">*</span></label>
            <Select
              id="ref-referrer"
              name="referrer_id"
              required
              options={[
                { value: "", label: "Select employee..." },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.full_name}${e.job_title ? ` - ${e.job_title}` : ""}`,
                })),
              ]}
            />
            <select id="ref-referrer-native" aria-hidden="true" disabled className="hidden">
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name}{e.job_title ? ` — ${e.job_title}` : ""}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-navy-100 pt-4">
            <p className="text-xs font-bold text-navy-500 uppercase tracking-wide mb-3">Candidate details</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ref-cname" className={labelCls}>Full name <span className="text-red-500">*</span></label>
                <input id="ref-cname" name="candidate_name" required className={inputCls} placeholder="Jane Smith" />
              </div>
              <div>
                <label htmlFor="ref-cemail" className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input id="ref-cemail" name="candidate_email" type="email" required className={inputCls} placeholder="jane@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="ref-cphone" className={labelCls}>Phone</label>
                <input id="ref-cphone" name="candidate_phone" type="tel" className={inputCls} placeholder="+44 7700 900000" />
              </div>
              <div>
                <label htmlFor="ref-linkedin" className={labelCls}>LinkedIn</label>
                <input id="ref-linkedin" name="linkedin_url" type="url" className={inputCls} placeholder="linkedin.com/in/…" />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="ref-relationship" className={labelCls}>Relationship to candidate</label>
              <input id="ref-relationship" name="relationship" className={inputCls} placeholder="e.g. Former colleague, University friend" />
            </div>

            <div className="mt-4">
              <label htmlFor="ref-note" className={labelCls}>Why are you referring them?</label>
              <textarea
                id="ref-note"
                name="cover_note"
                className="flex min-h-[80px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                placeholder="Tell us why this person would be a great fit…"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60">
              {isPending ? "Submitting…" : "Submit referral"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Referral Detail Drawer ───────────────────────────────────────────────────

function ReferralDrawer({
  referral,
  job,
  referrer,
  isAdmin,
  onClose,
}: {
  referral: JobReferral;
  job: JobRow | undefined;
  referrer: EmployeeRow | undefined;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const statusCfg = STATUSES[referral.status] ?? STATUSES.pending;

  const PIPELINE: Array<keyof typeof STATUSES> = ["pending", "reviewing", "interviewing", "hired"];

  function handleStatus(next: JobReferral["status"]) {
    startTransition(() => { void updateReferralStatus(referral.id, next); });
  }

  function handleDelete() {
    if (!confirm("Delete this referral? This cannot be undone.")) return;
    startTransition(() => { void deleteReferral(referral.id); onClose(); });
  }

  return (
    <div className={`bg-white rounded-2xl border border-navy-200 overflow-hidden ${isPending ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-navy-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {initials(referral.candidate_name)}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">{referral.candidate_name}</h3>
            <p className="text-xs text-navy-400">{referral.candidate_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.cls}`}>{statusCfg.label}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="h-7 w-7 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pipeline tracker */}
      {referral.status !== "rejected" && (
        <div className="px-5 py-4 border-b border-navy-100 bg-navy-50/30">
          <div className="flex items-center gap-2">
            {PIPELINE.map((s, i) => {
              const cfg = STATUSES[s];
              const current = STATUSES[referral.status]?.step ?? 0;
              const isDone = cfg.step <= current;
              const isActive = s === referral.status;
              return (
                <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isDone ? "bg-blue-600 text-white" : "bg-navy-200 text-navy-400"}`}>
                    {isDone ? (isActive ? i + 1 : "✓") : i + 1}
                  </div>
                  <span className={`text-xs font-medium truncate ${isActive ? "text-navy-900" : "text-navy-400"}`}>{cfg.label}</span>
                  {i < PIPELINE.length - 1 && <div className={`flex-1 h-px ${isDone && !isActive ? "bg-blue-300" : "bg-navy-200"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-navy-100 text-xs">
        <div>
          <p className="text-navy-400 font-medium mb-0.5">Referred for</p>
          <p className="text-navy-800 font-semibold">{job?.title ?? "—"}</p>
          {job?.department && <p className="text-navy-400">{job.department}</p>}
        </div>
        <div>
          <p className="text-navy-400 font-medium mb-0.5">Referred by</p>
          <p className="text-navy-800 font-semibold">{referrer?.full_name ?? "—"}</p>
          {referrer?.job_title && <p className="text-navy-400">{referrer.job_title}</p>}
        </div>
        {referral.candidate_phone && (
          <div>
            <p className="text-navy-400 font-medium mb-0.5">Phone</p>
            <p className="text-navy-800">{referral.candidate_phone}</p>
          </div>
        )}
        {referral.relationship && (
          <div>
            <p className="text-navy-400 font-medium mb-0.5">Relationship</p>
            <p className="text-navy-800">{referral.relationship}</p>
          </div>
        )}
        <div>
          <p className="text-navy-400 font-medium mb-0.5">Submitted</p>
          <p className="text-navy-800">{fmtDate(referral.created_at)}</p>
        </div>
        {referral.linkedin_url && (
          <div>
            <p className="text-navy-400 font-medium mb-0.5">LinkedIn</p>
            <a href={referral.linkedin_url.startsWith("http") ? referral.linkedin_url : `https://${referral.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">
              View profile →
            </a>
          </div>
        )}
      </div>

      {/* Cover note */}
      {referral.cover_note && (
        <div className="px-5 py-4 border-b border-navy-100">
          <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-1.5">Referral note</p>
          <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">{referral.cover_note}</p>
        </div>
      )}

      {/* Rejection reason */}
      {referral.status === "rejected" && referral.rejection_reason && (
        <div className="px-5 py-4 border-b border-navy-100 bg-red-50/40">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1.5">Rejection reason</p>
          <p className="text-sm text-navy-700">{referral.rejection_reason}</p>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="px-5 py-4 bg-navy-50/30">
          <p className="text-xs font-semibold text-navy-400 uppercase tracking-wide mb-3">Move pipeline</p>
          <div className="flex flex-wrap gap-2">
            {(["pending", "reviewing", "interviewing", "hired", "rejected"] as const).map((s) => {
              if (s === referral.status) return null;
              const cfg = STATUSES[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatus(s)}
                  disabled={isPending}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                    s === "hired" ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                    : s === "rejected" ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-navy-200 bg-white text-navy-700 hover:bg-navy-50"
                  }`}
                >
                  → {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-navy-100">
            <button type="button" onClick={handleDelete} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
              Delete referral
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Select (inline table) ────────────────────────────────────────────

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ReferralsClient({ referrals, jobs, employees, isAdmin }: Props) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(referrals[0]?.id ?? null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJob, setFilterJob] = useState("all");
  const [search, setSearch] = useState("");

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  // Stats
  const pending = referrals.filter((r) => r.status === "pending").length;
  const hired = referrals.filter((r) => r.status === "hired").length;
  const active = referrals.filter((r) => !["hired", "rejected"].includes(r.status)).length;

  // Unique jobs that have referrals (for filter dropdown)
  const jobsWithReferrals = [...new Set(referrals.map((r) => r.job_id))]
    .map((id) => jobMap[id])
    .filter(Boolean) as JobRow[];

  const filtered = referrals.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterJob !== "all" && r.job_id !== filterJob) return false;
    if (search) {
      const q = search.toLowerCase();
      const referrer = empMap[r.referrer_id];
      if (
        !r.candidate_name.toLowerCase().includes(q) &&
        !r.candidate_email.toLowerCase().includes(q) &&
        !referrer?.full_name.toLowerCase().includes(q) &&
        !(jobMap[r.job_id]?.title ?? "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const selectedReferral = referrals.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      {showSubmit && (
        <SubmitReferralModal
          jobs={jobs}
          employees={employees}
          onClose={() => setShowSubmit(false)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total referrals",  value: referrals.length },
          { label: "Pending review",   value: pending,  warn: pending > 0 },
          { label: "In pipeline",      value: active },
          { label: "Hired",            value: hired },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-navy-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.warn ? "text-amber-600" : "text-navy-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 flex-wrap">
        <input
          type="search"
          placeholder="Search candidate or referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search referrals"
          className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
        />
        <Select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-52"
          triggerClassName="h-9"
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled
          className="hidden"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <Select
          aria-label="Filter by job"
          value={filterJob}
          onChange={setFilterJob}
          className="w-64"
          triggerClassName="h-9"
          options={[
            { value: "all", label: "All roles" },
            ...jobsWithReferrals.map((j) => ({ value: j.id, label: j.title })),
          ]}
        />
        <select
          aria-label="Filter by job"
          value={filterJob}
          onChange={(e) => setFilterJob(e.target.value)}
          disabled
          className="hidden"
        >
          <option value="all">All roles</option>
          {jobsWithReferrals.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        <span className="text-sm text-navy-500 sm:ml-auto">{filtered.length} referral{filtered.length !== 1 ? "s" : ""}</span>
        <button
          type="button"
          onClick={() => setShowSubmit(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Refer someone
        </button>
      </div>

      {/* Empty state */}
      {referrals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-navy-200">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-base font-semibold text-navy-900 mb-1">No referrals yet</h3>
          <p className="text-sm text-navy-500 mb-5">Employees can refer great people they know for open roles.</p>
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Refer someone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: referral list */}
          <div className="lg:col-span-2 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-navy-200">
                <p className="text-sm text-navy-400">No referrals match your filters.</p>
              </div>
            ) : (
              filtered.map((r) => {
                const job = jobMap[r.job_id];
                const referrer = empMap[r.referrer_id];
                const cfg = STATUSES[r.status] ?? STATUSES.pending;
                const isSelected = r.id === selectedId;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-navy-200 bg-white hover:shadow-sm hover:border-navy-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                          {initials(r.candidate_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-900 truncate">{r.candidate_name}</p>
                          <p className="text-xs text-navy-400 truncate">{r.candidate_email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-navy-400">
                      <span className="truncate">{job?.title ?? "Unknown role"}</span>
                      <span className="flex-shrink-0 ml-2">via {referrer?.full_name?.split(" ")[0] ?? "?"}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: detail panel */}
          <div className="lg:col-span-3">
            {selectedReferral ? (
              <ReferralDrawer
                referral={selectedReferral}
                job={jobMap[selectedReferral.job_id]}
                referrer={empMap[selectedReferral.referrer_id]}
                isAdmin={isAdmin}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-navy-200 flex items-center justify-center h-48">
                <p className="text-sm text-navy-400">Select a referral to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
