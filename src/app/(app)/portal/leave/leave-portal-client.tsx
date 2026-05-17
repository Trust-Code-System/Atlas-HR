"use client";

import { useActionState, useTransition, useState } from "react";
import type { LeaveRequest } from "@/types/database";
import { submitLeaveRequest, cancelLeaveRequest } from "./actions";
import type { ActionResult } from "./actions";

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
  { value: "study", label: "Study Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

type Filter = "all" | "pending" | "approved" | "rejected";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;
}

export function LeavePortalClient({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(submitLeaveRequest, null);
  const [cancelPending, startCancel] = useTransition();

  const filtered = leaveRequests.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
  };

  function handleCancel(id: string) {
    startCancel(async () => { await cancelLeaveRequest(id); });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-navy-50 rounded-[10px] p-1">
          {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-slate-500 hover:text-navy-900"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-[10px] bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Request Leave
        </button>
      </div>

      {/* Leave list */}
      {filtered.length === 0 ? (
        <div className="rounded-[18px] border border-navy-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">No leave requests found.</p>
        </div>
      ) : (
        <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-navy-50">
            {filtered.map((r) => {
              const badge =
                r.status === "approved" ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : r.status === "pending" ? "bg-amber-50 text-amber-700 ring-amber-200"
                  : r.status === "cancelled" ? "bg-slate-50 text-slate-500 ring-slate-200"
                  : "bg-red-50 text-red-700 ring-red-200";
              const days = daysBetween(r.start_date, r.end_date);
              return (
                <div key={r.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy-900 text-sm capitalize">{r.leave_type.replace(/_/g, " ")}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 capitalize ${badge}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(r.start_date)} – {formatDate(r.end_date)} · {days} {days === 1 ? "day" : "days"}
                    </p>
                    {r.reason && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{r.reason}</p>}
                  </div>
                  {r.status === "pending" && (
                    <button
                      type="button"
                      disabled={cancelPending}
                      onClick={() => handleCancel(r.id)}
                      className="shrink-0 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Request form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[20px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-900">Request Leave</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-navy-900 hover:bg-navy-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              action={async (fd) => {
                await action(fd);
                if (!state?.error) setShowForm(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label htmlFor="leave_type" className="block text-xs font-semibold text-navy-700 mb-1">Leave type</label>
                <select
                  id="leave_type"
                  name="leave_type"
                  required
                  className="w-full rounded-[10px] border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type…</option>
                  {LEAVE_TYPES.map((lt) => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start_date" className="block text-xs font-semibold text-navy-700 mb-1">Start date</label>
                  <input
                    id="start_date"
                    type="date"
                    name="start_date"
                    required
                    className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-xs font-semibold text-navy-700 mb-1">End date</label>
                  <input
                    id="end_date"
                    type="date"
                    name="end_date"
                    required
                    className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Reason (optional)</label>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Brief reason for your leave…"
                  className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-[10px] border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-[10px] bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {pending ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
