"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, Check, X, Plus, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from "./actions";
import type { LeaveRequest, Employee } from "@/types/database";

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Parental Leave",
  "Compassionate Leave",
  "Study Leave",
  "Unpaid Leave",
  "Other",
];

const STATUS_COLORS: Record<LeaveRequest["status"], string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

type LeaveWithEmployee = LeaveRequest & { employee: Pick<Employee, "id" | "full_name" | "job_title"> | null };

interface Props {
  requests: LeaveWithEmployee[];
  employees: Pick<Employee, "id" | "full_name">[];
  isAdmin: boolean;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function LeaveClient({ requests, employees, isAdmin }: Props) {
  const [filter, setFilter] = useState<"all" | LeaveRequest["status"]>("all");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  function handleApprove(id: string) {
    startTransition(async () => {
      const res = await approveLeaveRequest(id);
      if (!res.ok) alert(res.error);
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const res = await rejectLeaveRequest(id);
      if (!res.ok) alert(res.error);
    });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createLeaveRequest({
        employee_id: fd.get("employee_id") as string,
        leave_type: fd.get("leave_type") as string,
        start_date: fd.get("start_date") as string,
        end_date: fd.get("end_date") as string,
        reason: (fd.get("reason") as string) || undefined,
      });
      if (res.ok) setShowModal(false);
      else setError(res.error);
    });
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Leave</h1>
          <p className="text-sm text-[--text-secondary]">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[--accent] px-4 py-2.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] transition-colors"
        >
          <Plus size={15} />
          New request
        </button>
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors capitalize ${
              filter === s
                ? "border-[--accent] bg-[--accent] text-[--primary-foreground]"
                : "border-[--border] text-[--text-secondary] hover:bg-[--bg-hover]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-2xl border border-dashed border-[--border]">
          <CalendarDays size={32} className="text-[--text-tertiary]" />
          <p className="font-semibold text-[--text-primary]">
            {requests.length === 0 ? "No leave requests yet" : "No requests match this filter"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[--border] bg-[--bg-card] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--border] bg-[--bg-hover]">
                {["Employee", "Type", "Dates", "Duration", "Status", isAdmin ? "Actions" : ""].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] last:w-24">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-[--bg-hover] transition-colors">
                  <td className="px-4 py-3">
                    {req.employee ? (
                      <Link href={`/workspace/people/${req.employee.id}`} className="text-sm font-medium text-[--text-primary] hover:text-[--accent] transition-colors">
                        {req.employee.full_name}
                      </Link>
                    ) : (
                      <span className="text-sm text-[--text-tertiary]">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[--text-secondary]">{req.leave_type}</td>
                  <td className="px-4 py-3 text-sm text-[--text-secondary]">
                    {formatDate(req.start_date)} → {formatDate(req.end_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[--text-secondary]">
                    {daysBetween(req.start_date, req.end_date)} day{daysBetween(req.start_date, req.end_date) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                            title="Approve"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                            title="Reject"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New leave request modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--bg-card] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[--border] px-6 py-4">
              <h2 className="text-lg font-semibold text-[--text-primary]">New leave request</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-[--text-tertiary] hover:bg-[--bg-hover] transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[--text-primary] mb-1">Employee *</label>
                <Select
                  name="employee_id"
                  defaultValue="none"
                  items={[
                    { value: "none", label: "Select employee" },
                    ...employees.map((employee) => ({ value: employee.id, label: employee.full_name })),
                  ]}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select employee</SelectItem>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[--text-primary] mb-1">Leave type *</label>
                <Select
                  name="leave_type"
                  defaultValue="none"
                  items={[
                    { value: "none", label: "Select leave type" },
                    ...LEAVE_TYPES.map((type) => ({ value: type, label: type.replace("_", " ") })),
                  ]}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[--text-primary] mb-1">Start date *</label>
                  <input name="start_date" type="date" required className="w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[--text-primary] mb-1">End date *</label>
                  <input name="end_date" type="date" required className="w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[--text-primary] mb-1">Reason</label>
                <textarea name="reason" rows={3} placeholder="Optional reason…" className="w-full rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5 text-sm text-[--text-primary] outline-none focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20 resize-none" />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-[--border] px-4 py-2.5 text-sm font-medium text-[--text-secondary] hover:bg-[--bg-hover] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-xl bg-[--accent] px-4 py-2.5 text-sm font-semibold text-[--primary-foreground] hover:bg-[--accent-hover] disabled:opacity-60 transition-colors">
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
