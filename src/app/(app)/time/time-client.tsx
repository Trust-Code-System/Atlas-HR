"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { logHours, submitWeek, approveEntry } from "./actions";
import type { TimeActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORIES = [
  { value: "regular", label: "Regular" },
  { value: "overtime", label: "Overtime" },
  { value: "sick", label: "Sick" },
  { value: "holiday", label: "Holiday" },
  { value: "training", label: "Training" },
];

const categoryColors: Record<string, string> = {
  regular: "bg-blue-100 text-blue-700",
  overtime: "bg-amber-100 text-amber-700",
  sick: "bg-red-100 text-red-700",
  holiday: "bg-purple-100 text-purple-700",
  training: "bg-blue-100 text-blue-700",
};

const statusColors: Record<string, string> = {
  draft: "bg-navy-100 text-navy-600",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
};

interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  hours: number;
  category: string;
  status: string;
  notes: string | null;
  approved_by: string | null;
}

interface Employee {
  id: string;
  full_name: string;
}

interface Props {
  employee: Employee | null;
  myEntries: TimeEntry[];
  weekStartStr: string;
  weekEndStr: string;
  isAdmin: boolean;
  pendingEntries: TimeEntry[];
  pendingEmployees: Employee[];
}

function LogHoursForm({
  weekDates,
  onSuccess,
}: {
  weekDates: string[];
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<TimeActionResult, FormData>(logHours, null);
  const [submitted, setSubmitted] = useState(false);

  if (state?.success && !submitted) {
    setSubmitted(true);
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label htmlFor="log_date" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
            Date <span className="text-red-500">*</span>
          </label>
          <Select
            id="log_date"
            name="date"
            options={weekDates.map((d, i) => ({
              value: d,
              label: `${DAYS[i]} (${new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })})`,
            }))}
          />
        </div>
        <div>
          <label htmlFor="log_hours" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
            Hours <span className="text-red-500">*</span>
          </label>
          <input
            id="log_hours"
            type="number"
            name="hours"
            min="0.5"
            max="24"
            step="0.5"
            defaultValue="8"
            required
            className="flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="log_category" className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Category</label>
          <Select
            id="log_category"
            name="category"
            options={CATEGORIES}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">Notes</label>
          <input
            type="text"
            name="notes"
            placeholder="Optional"
            className="flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isPending} size="sm">Log hours</Button>
      </div>
    </form>
  );
}

function ApproveButton({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handle() {
    startTransition(async () => {
      await approveEntry(entryId);
      setDone(true);
    });
  }

  if (done) return <span className="text-xs font-semibold text-blue-700">Approved</span>;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="text-xs font-medium text-blue-700 hover:text-green-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
    >
      {isPending ? "…" : "Approve"}
    </button>
  );
}

export function TimeClient({
  employee,
  myEntries,
  weekStartStr,
  weekEndStr,
  isAdmin,
  pendingEntries,
  pendingEmployees,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Build week dates (Mon–Sun)
  const weekDates: string[] = [];
  const start = new Date(weekStartStr + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  function prevWeek() {
    const d = new Date(weekStartStr + "T12:00:00");
    d.setDate(d.getDate() - 7);
    router.push(`/time?week=${d.toISOString().split("T")[0]}`);
  }

  function nextWeek() {
    const d = new Date(weekStartStr + "T12:00:00");
    d.setDate(d.getDate() + 7);
    router.push(`/time?week=${d.toISOString().split("T")[0]}`);
  }

  function handleSubmitWeek() {
    startTransition(async () => {
      await submitWeek(weekStartStr);
    });
  }

  const totalHours = myEntries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const hasDraft = myEntries.some((e) => e.status === "draft");

  const weekLabel = `${new Date(weekStartStr + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(weekEndStr + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const employeeMap = Object.fromEntries(pendingEmployees.map((e) => [e.id, e]));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Time Tracking</h1>
              <p className="text-blue-300 text-sm mt-0.5 font-mono">{weekLabel}</p>
            </div>
          </div>
          {/* Week navigation */}
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" aria-label="Previous week" onClick={prevWeek}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ring-1 ring-white/15">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" aria-label="Next week" onClick={nextWeek}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ring-1 ring-white/15">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* My timesheet */}
      {employee ? (
        <>
          {/* Weekly grid */}
          <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden mb-6">
            <div className="grid grid-cols-8 border-b border-navy-200">
              <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-navy-500 bg-navy-50" />
              {DAYS.map((day, i) => {
                const d = weekDates[i];
                const isToday = d === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={day}
                    className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide bg-navy-50 ${isToday ? "text-blue-700" : "text-navy-500"}`}
                  >
                    <div>{day}</div>
                    <div className={`text-base font-bold mt-0.5 ${isToday ? "text-blue-700" : "text-navy-800"}`}>
                      {new Date(d + "T12:00:00").getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {CATEGORIES.map((cat) => {
              const catEntries = myEntries.filter((e) => e.category === cat.value);
              const hasAny = catEntries.length > 0;
              if (!hasAny && cat.value !== "regular") return null;

              return (
                <div key={cat.value} className="grid grid-cols-8 border-b border-navy-100 last:border-b-0">
                  <div className="px-3 py-3 flex items-center">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${categoryColors[cat.value]}`}>
                      {cat.label}
                    </span>
                  </div>
                  {weekDates.map((d) => {
                    const entry = catEntries.find((e) => e.date === d);
                    return (
                      <div key={d} className="px-2 py-3 text-center">
                        {entry ? (
                          <div>
                            <p className="text-sm font-bold text-navy-900">{entry.hours}h</p>
                            <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${statusColors[entry.status] ?? statusColors.draft}`}>
                              {entry.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-navy-300">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Totals row */}
            <div className="grid grid-cols-8 bg-navy-50 border-t border-navy-200">
              <div className="px-3 py-3 text-xs font-bold text-navy-700 uppercase tracking-wide">Total</div>
              {weekDates.map((d) => {
                const dayTotal = myEntries
                  .filter((e) => e.date === d)
                  .reduce((sum, e) => sum + (e.hours ?? 0), 0);
                return (
                  <div key={d} className="px-2 py-3 text-center text-sm font-bold text-navy-900">
                    {dayTotal > 0 ? `${dayTotal}h` : "—"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary + submit */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-navy-200 px-5 py-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-navy-900">Week total: <span className="text-blue-700">{totalHours}h</span></p>
              <p className="text-xs text-navy-400 mt-0.5">{myEntries.length} entries logged</p>
            </div>
            {hasDraft && (
              <Button
                type="button"
                onClick={handleSubmitWeek}
                loading={isPending}
                size="sm"
              >
                Submit week for approval
              </Button>
            )}
            {!hasDraft && myEntries.length > 0 && (
              <span className="text-sm font-medium text-blue-700">Week submitted</span>
            )}
          </div>

          {/* Log hours form */}
          <div className="bg-white rounded-2xl border border-navy-200 p-5 mb-8">
            <h2 className="text-sm font-bold text-navy-900 mb-4">Log hours</h2>
            <LogHoursForm weekDates={weekDates} onSuccess={() => {}} />
          </div>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-sm text-amber-700">
          No employee record linked to your account. Contact an admin to be added as an employee.
        </div>
      )}

      {/* Admin: pending approvals */}
      {isAdmin && pendingEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-200">
            <h2 className="text-sm font-bold text-navy-900">Pending approvals ({pendingEntries.length})</h2>
          </div>
          <div className="divide-y divide-navy-100">
            {pendingEntries.map((entry) => {
              const emp = employeeMap[entry.employee_id];
              return (
                <div key={entry.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-800">
                      {emp ? emp.full_name : "Unknown"}
                    </p>
                    <p className="font-mono text-xs text-navy-500">
                      {new Date(entry.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}{entry.hours}h
                      {" · "}<span className={`font-semibold rounded-full px-1.5 py-0.5 text-xs ${categoryColors[entry.category] ?? ""}`}>{entry.category}</span>
                      {entry.notes && ` · ${entry.notes}`}
                    </p>
                  </div>
                  <ApproveButton entryId={entry.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
