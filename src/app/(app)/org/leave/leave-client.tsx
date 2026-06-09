"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  createLeaveRequest,
} from "./actions";
import type { LeaveRequest } from "@/types/database";
import { AiSummaryButton } from "@/components/ai/ai-summary-button";

interface Employee {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface Props {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  employeeMap: Record<string, Employee>;
  isAdmin: boolean;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";
type ViewMode = "list" | "calendar";

const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const todayIso = new Date().toISOString().slice(0, 10);

const statusVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

const leaveTypes = [
  { value: "annual", label: "Annual leave" },
  { value: "sick", label: "Sick leave" },
  { value: "personal", label: "Personal leave" },
  { value: "maternity", label: "Maternity leave" },
  { value: "paternity", label: "Paternity leave" },
  { value: "bereavement", label: "Bereavement leave" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "other", label: "Other" },
];

const leaveTypeColors: Record<string, string> = {
  annual: "bg-blue-500",
  sick: "bg-red-400",
  personal: "bg-blue-400",
  maternity: "bg-purple-400",
  paternity: "bg-indigo-400",
  bereavement: "bg-gray-400",
  unpaid: "bg-amber-400",
  other: "bg-teal-400",
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  if (!value) return "dd/mm/yyyy";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "dd/mm/yyyy";
  return `${day}/${month}/${year}`;
}

function parseIsoDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DatePickerField({
  label,
  name,
  required,
  value: controlledValue,
  onValueChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = (v: string) => {
    if (!isControlled) setInternalValue(v);
    onValueChange?.(v);
  };
  const selected = parseIsoDate(value);
  const initialMonth = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());
  const [open, setOpen] = useState(false);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const leadingDays = firstDay === 0 ? 6 : firstDay - 1;
  const previousMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - leadingDays + 1;
    if (dayNumber < 1) {
      const date = new Date(viewYear, viewMonth - 1, previousMonthDays + dayNumber);
      return { date, muted: true };
    }
    if (dayNumber > daysInMonth) {
      const date = new Date(viewYear, viewMonth + 1, dayNumber - daysInMonth);
      return { date, muted: true };
    }
    return { date: new Date(viewYear, viewMonth, dayNumber), muted: false };
  });

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(offset: number) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function chooseDate(date: Date) {
    setValue(toIsoDate(date));
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input name={name} value={value} readOnly className="sr-only" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-navy-200 bg-white px-3.5 text-left text-sm font-medium text-navy-900 shadow-xs transition-colors hover:border-blue-200 hover:bg-blue-50/30 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "font-mono text-navy-900" : "font-mono text-navy-400"}>
          {formatDisplayDate(value)}
        </span>
        <CalendarIcon className="h-5 w-5 text-navy-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(21rem,calc(100vw-3rem))] rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-navy-900/12">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-sm font-bold text-navy-950">{monthLabel}</p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-navy-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="flex h-8 items-center justify-center text-[11px] font-bold text-navy-400">
                {day}
              </div>
            ))}
            {cells.map(({ date, muted }) => {
              const iso = toIsoDate(date);
              const selectedDay = iso === value;
              const today = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => chooseDate(date)}
                  className={`flex h-9 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    selectedDay
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : today
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : muted
                          ? "text-navy-300 hover:bg-navy-50"
                          : "text-navy-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-3">
            <button
              type="button"
              onClick={() => setValue("")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => chooseDate(new Date())}
              className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApproveRejectButtons({ requestId }: { requestId: string }) {
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() =>
          startApprove(async () => {
            await approveLeaveRequest(requestId);
          })
        }
        disabled={approvePending || rejectPending}
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {approvePending ? (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        Approve
      </button>
      <button
        onClick={() =>
          startReject(async () => {
            await rejectLeaveRequest(requestId);
          })
        }
        disabled={approvePending || rejectPending}
        className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {rejectPending ? (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        Reject
      </button>
    </div>
  );
}

function RequestLeaveModal({
  employees,
  onClose,
}: {
  employees: Employee[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createLeaveRequest, null);

  // Controlled fields so the AI quick-fill can prefill them.
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Natural-language quick-fill (§3).
  const [nl, setNl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [nlNote, setNlNote] = useState<string | null>(null);

  async function quickFill() {
    if (nl.trim().length < 2) return;
    setParsing(true);
    setNlError(null);
    setNlNote(null);
    try {
      const res = await fetch("/api/ai/parse-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNlError(data?.error ?? "Couldn't parse that.");
        return;
      }
      const filled: string[] = [];
      if (data.leave_type) { setLeaveType(data.leave_type); filled.push("type"); }
      if (data.start_date) { setStartDate(data.start_date); filled.push("start"); }
      if (data.end_date) { setEndDate(data.end_date); filled.push("end"); }
      if (data.reason) { setReason(data.reason); filled.push("reason"); }
      setNlNote(filled.length ? "Filled in below — review and submit." : "Couldn't pull dates from that — try being more specific.");
    } catch {
      setNlError("Something went wrong parsing that.");
    } finally {
      setParsing(false);
    }
  }

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-900 text-lg">Request leave</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {state.error}
            </div>
          )}

          {/* AI natural-language quick-fill (§3) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Describe it in plain English
            </label>
            <div className="flex gap-2">
              <input
                value={nl}
                onChange={(e) => setNl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void quickFill(); } }}
                placeholder="e.g. sick leave Monday to Wednesday next week"
                className="flex-1 h-10 rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => void quickFill()}
                disabled={parsing || nl.trim().length < 2}
                className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {parsing ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Fill"}
              </button>
            </div>
            {nlError && <p className="text-xs text-red-600 mt-1.5">{nlError}</p>}
            {nlNote && !nlError && <p className="text-xs text-blue-700 mt-1.5">{nlNote}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <Select
              name="employee_id"
              required
              options={[
                { value: "", label: "Select employee…" },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.full_name}${e.job_title ? ` — ${e.job_title}` : ""}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
              Leave type <span className="text-red-500">*</span>
            </label>
            <Select
              name="leave_type"
              required
              value={leaveType}
              onChange={setLeaveType}
              options={[{ value: "", label: "Select type…" }, ...leaveTypes]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePickerField name="start_date" label="Start date" required value={startDate} onValueChange={setStartDate} />
            <DatePickerField name="end_date" label="End date" required value={endDate} onValueChange={setEndDate} />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
              Reason (optional)
            </label>
            <Input name="reason" placeholder="Brief reason for leave…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" loading={isPending}>
              Submit request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamCalendar({
  leaveRequests,
  employeeMap,
}: {
  leaveRequests: LeaveRequest[];
  employeeMap: Record<string, Employee>;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;
  const visibleSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDate = new Date(year, month, visibleSelectedDay);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Only approved leave requests visible on the calendar
  const approved = leaveRequests.filter((r) => r.status === "approved");

  // Find employees with leave in this month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const empLeavePairs = approved
    .filter((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      return s <= monthEnd && e >= monthStart;
    })
    .map((r) => ({ req: r, emp: employeeMap[r.employee_id] }))
    .filter((x) => x.emp != null);

  // Deduplicate employees, keeping all their leave bars
  const empIds = [...new Set(empLeavePairs.map((x) => x.emp!.id))];

  // Sort by employee name
  const sortedEmpIds = empIds.sort((a, b) =>
    (employeeMap[a]?.full_name ?? "").localeCompare(employeeMap[b]?.full_name ?? "")
  );

  function isOnLeave(empId: string, day: number): LeaveRequest | undefined {
    const date = new Date(year, month, day);
    return approved.find((r) => {
      if (r.employee_id !== empId) return false;
      return new Date(r.start_date) <= date && new Date(r.end_date) >= date;
    });
  }

  const selectedLeave = approved.filter((r) => {
    const s = new Date(r.start_date);
    const e = new Date(r.end_date);
    return s <= selectedDate && e >= selectedDate;
  });

  const selectedDateLabel = selectedDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
        <h2 className="font-semibold text-navy-900">Team calendar</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
            aria-label="Previous month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-navy-800 w-36 text-center">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
            aria-label="Next month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-5 py-3 border-b border-navy-50 bg-navy-50/50">
        {leaveTypes.slice(0, 5).map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${leaveTypeColors[t.value] ?? "bg-navy-300"}`} />
            <span className="text-xs text-navy-500">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="text-left text-xs font-semibold text-navy-500 px-4 py-2 w-40 bg-navy-50/50">
                Employee
              </th>
              {days.map((d) => {
                const dateObj = new Date(year, month, d);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                return (
                  <th
                    key={d}
                    className={`text-center text-xs font-medium px-0.5 min-w-[34px] ${
                      d === todayDay
                        ? "text-blue-700 font-bold"
                        : isWeekend
                        ? "text-navy-300"
                        : "text-navy-400"
                    } ${isWeekend ? "bg-navy-50/70" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        d === visibleSelectedDay ? "bg-blue-600 text-white shadow-sm" : "hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {d}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEmpIds.length > 0 ? (
              sortedEmpIds.map((empId) => {
                const emp = employeeMap[empId];
                return (
                  <tr key={empId} className="border-b border-navy-50 hover:bg-navy-50/30 transition-colors">
                    <td className="px-4 py-2.5 bg-white">
                      <p className="text-xs font-semibold text-navy-800 truncate max-w-[140px]">
                        {emp?.full_name ?? "Unknown"}
                      </p>
                      {emp?.job_title && (
                        <p className="text-xs text-navy-400 truncate max-w-[140px]">{emp.job_title}</p>
                      )}
                    </td>
                    {days.map((d) => {
                      const dateObj = new Date(year, month, d);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const req = isOnLeave(empId, d);
                      const isToday = d === todayDay;

                      // Determine bar segment positioning
                      let barClass = "";
                      if (req) {
                        const reqStart = new Date(req.start_date);
                        const reqEnd = new Date(req.end_date);
                        const isFirst = reqStart.getDate() === d && reqStart.getMonth() === month && reqStart.getFullYear() === year;
                        const isLast = reqEnd.getDate() === d && reqEnd.getMonth() === month && reqEnd.getFullYear() === year;
                        if (isFirst && isLast) barClass = "rounded-full mx-1";
                        else if (isFirst) barClass = "rounded-l-full ml-1";
                        else if (isLast) barClass = "rounded-r-full mr-1";
                        else barClass = "";
                      }

                      return (
                        <td
                          key={d}
                          className={`px-0.5 py-3 ${isWeekend ? "bg-navy-50/50" : ""} ${isToday ? "bg-blue-50/40" : ""} ${d === visibleSelectedDay ? "bg-blue-50" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedDay(d)}
                            className="block h-8 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={`Select ${d} ${monthLabel}`}
                          >
                            {req && (
                              <div
                                className={`h-5 ${leaveTypeColors[req.leave_type] ?? "bg-blue-500"} opacity-80 ${barClass}`}
                                title={`${emp?.full_name}: ${req.leave_type} leave`}
                              />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={daysInMonth + 1}
                  className="text-center py-12 text-sm text-navy-400"
                >
                  No approved leave in {monthLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-navy-100 bg-navy-50/60 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Selected date</p>
            <p className="mt-1 text-sm font-semibold text-navy-900">{selectedDateLabel}</p>
          </div>
          <div className="w-full sm:max-w-xl">
            {selectedLeave.length > 0 ? (
              <div className="space-y-2">
                {selectedLeave.map((req) => {
                  const emp = employeeMap[req.employee_id];
                  return (
                    <div key={req.id} className="flex items-center justify-between rounded-xl border border-navy-200 bg-white px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-navy-800">{emp?.full_name ?? "Unknown employee"}</p>
                        <p className="text-xs capitalize text-navy-500">{req.leave_type.replace("_", " ")} leave</p>
                      </div>
                      <span className={`h-3 w-3 rounded-full ${leaveTypeColors[req.leave_type] ?? "bg-blue-500"}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-navy-200 bg-white px-3 py-3 text-sm text-navy-500">
                No approved leave on this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaveClient({ leaveRequests, employees, employeeMap, isAdmin }: Props) {
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const initialFilter: FilterStatus =
    requestedStatus === "pending" || requestedStatus === "approved" || requestedStatus === "rejected"
      ? requestedStatus
      : "all";
  const [filter, setFilter] = useState<FilterStatus>(initialFilter);
  const [view, setView] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const handleClose = useCallback(() => setShowModal(false), []);

  const filtered = leaveRequests.filter(
    (r) => filter === "all" || r.status === filter
  );

  const counts = {
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
  };

  const filterButtons: { key: FilterStatus; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <>
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-navy-200 bg-navy-50 p-0.5 mr-1">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === "list" ? "bg-white text-navy-800 shadow-sm" : "text-navy-500 hover:text-navy-700"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === "calendar" ? "bg-white text-navy-800 shadow-sm" : "text-navy-500 hover:text-navy-700"
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Filter chips — only in list view */}
          {view === "list" &&
            filterButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? "bg-blue-600 text-white"
                    : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                }`}
              >
                {label}
              </button>
            ))}
        </div>

        {isAdmin && (
          <Button type="button" onClick={() => setShowModal(true)} size="sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request leave
          </Button>
        )}
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <TeamCalendar leaveRequests={leaveRequests} employeeMap={employeeMap} />
      ) : (
        <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50 border-b border-navy-200 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                <div className="col-span-3">Employee</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3 hidden md:block">Dates</div>
                <div className="col-span-1 hidden sm:block">Days</div>
                <div className="col-span-3 sm:col-span-2">Status</div>
                {isAdmin && <div className="col-span-1 hidden lg:block" />}
              </div>

              <div className="divide-y divide-navy-100">
                {filtered.map((req) => {
                  const emp = employeeMap[req.employee_id];
                  const start = new Date(req.start_date);
                  const end = new Date(req.end_date);
                  const days =
                    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <div key={req.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-navy-50/50 transition-colors">
                      <div className="col-span-3 min-w-0">
                        <p className="text-sm font-semibold text-navy-800 truncate">
                          {emp?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-navy-400 truncate">{emp?.job_title ?? ""}</p>
                      </div>
                      <div className="col-span-2 text-sm text-navy-600 capitalize">
                        {req.leave_type.replace(/_/g, " ")}
                      </div>
                      <div className="col-span-3 hidden md:block font-mono text-sm text-navy-600">
                        {start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {" – "}
                        {end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div className="col-span-1 hidden sm:block text-sm text-navy-600">
                        {days}d
                      </div>
                      <div className="col-span-3 sm:col-span-2 flex items-center gap-2 flex-wrap">
                        {req.status === "pending" && isAdmin ? (
                          <>
                            <ApproveRejectButtons requestId={req.id} />
                            <AiSummaryButton
                              endpoint={`/api/ai/leave-recommendation?id=${req.id}`}
                              title="AI eligibility check"
                              subtitle={`${emp?.full_name ?? "Employee"} · ${req.leave_type.replace(/_/g, " ")} leave`}
                              buttonLabel="AI check"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            />
                          </>
                        ) : (
                          <Badge variant={statusVariant[req.status] ?? "default"}>
                            {req.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto mb-4">
                <svg className="h-7 w-7 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-navy-700 mb-1">No leave requests</p>
              <p className="text-sm text-navy-400">
                {filter === "all"
                  ? "No leave requests have been submitted yet."
                  : `No ${filter} leave requests.`}
              </p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <RequestLeaveModal employees={employees} onClose={handleClose} />
      )}
    </>
  );
}
