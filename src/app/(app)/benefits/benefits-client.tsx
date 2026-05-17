"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { BenefitPlan, BenefitEnrolment } from "@/types/database";
import type { Employee } from "@/types/database";
import { createPlan, updatePlanStatus, deletePlan, enrolEmployee, updateEnrolmentStatus } from "./actions";
import type { BenefitsActionResult } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeRow = Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">;

interface Props {
  plans: BenefitPlan[];
  enrolments: BenefitEnrolment[];
  employees: EmployeeRow[];
  isAdmin: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_TYPES = [
  { key: "health",   label: "Health",      color: "bg-rose-100 text-rose-700",   icon: "🏥" },
  { key: "dental",   label: "Dental",      color: "bg-blue-100 text-blue-700",   icon: "🦷" },
  { key: "vision",   label: "Vision",      color: "bg-purple-100 text-purple-700", icon: "👁️" },
  { key: "pension",  label: "Pension",     color: "bg-amber-100 text-amber-700", icon: "🏦" },
  { key: "life",     label: "Life",        color: "bg-green-100 text-green-700", icon: "🛡️" },
  { key: "other",    label: "Other",       color: "bg-navy-100 text-navy-600",   icon: "📋" },
] as const;

const ENROLMENT_STATUS = {
  active:     { label: "Active",     cls: "bg-green-100 text-green-700" },
  pending:    { label: "Pending",    cls: "bg-amber-100 text-amber-700" },
  opted_out:  { label: "Opted out",  cls: "bg-navy-100 text-navy-500" },
  terminated: { label: "Terminated", cls: "bg-red-100 text-red-600" },
} as const;

const CURRENCIES = ["GBP", "USD", "EUR", "NGN", "INR", "AUD", "CAD"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanType(type: string) {
  return PLAN_TYPES.find((t) => t.key === type) ?? PLAN_TYPES[PLAN_TYPES.length - 1];
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

// ─── Create Plan Modal ────────────────────────────────────────────────────────

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<BenefitsActionResult, FormData>(createPlan, null);

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
          <h2 className="text-lg font-bold text-navy-900">Add benefit plan</h2>
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
            <label htmlFor="plan-name" className={labelCls}>Plan name <span className="text-red-500">*</span></label>
            <input id="plan-name" name="name" required className={inputCls} placeholder="e.g. Bupa Health Cover" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plan-type" className={labelCls}>Type</label>
              <Select id="plan-type" name="type" options={PLAN_TYPES.map((t) => ({ value: t.key, label: `${t.icon} ${t.label}` }))} />
            </div>
            <div>
              <label htmlFor="plan-status" className={labelCls}>Status</label>
              <Select
                id="plan-status"
                name="status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>
          </div>

          <div>
            <label htmlFor="plan-provider" className={labelCls}>Provider</label>
            <input id="plan-provider" name="provider" className={inputCls} placeholder="e.g. Bupa, Aviva, NEST" />
          </div>

          <div>
            <label htmlFor="plan-description" className={labelCls}>Description</label>
            <textarea
              id="plan-description"
              name="description"
              className="flex min-h-[72px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Brief description of what's covered…"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="plan-currency" className={labelCls}>Currency</label>
              <Select id="plan-currency" name="currency" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div>
              <label htmlFor="plan-employer-contrib" className={labelCls}>Employer %</label>
              <input id="plan-employer-contrib" name="employer_contribution" type="number" min="0" max="100" step="0.5" defaultValue="0" className={inputCls} />
            </div>
            <div>
              <label htmlFor="plan-employee-contrib" className={labelCls}>Employee %</label>
              <input id="plan-employee-contrib" name="employee_contribution" type="number" min="0" max="100" step="0.5" defaultValue="0" className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="plan-renewal-date" className={labelCls}>Renewal date</label>
            <DatePicker id="plan-renewal-date" name="renewal_date" placeholder="Select renewal date" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Create plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Enrol Modal ──────────────────────────────────────────────────────────────

function EnrolModal({
  plans,
  employees,
  enrolments,
  onClose,
}: {
  plans: BenefitPlan[];
  employees: EmployeeRow[];
  enrolments: BenefitEnrolment[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<BenefitsActionResult, FormData>(enrolEmployee, null);
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? "");

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const alreadyEnrolled = new Set(
    enrolments.filter((e) => e.plan_id === selectedPlan && e.status === "active").map((e) => e.employee_id),
  );

  const inputCls = "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
  const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-900">Enrol employee</h2>
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
            <label htmlFor="enrol-plan" className={labelCls}>Benefit plan <span className="text-red-500">*</span></label>
            <Select
              id="enrol-plan"
              name="plan_id"
              value={selectedPlan}
              onChange={setSelectedPlan}
              options={plans.filter((p) => p.status === "active").map((p) => {
                const pt = getPlanType(p.type);
                return { value: p.id, label: `${pt.icon} ${p.name}` };
              })}
            />
          </div>

          <div>
            <label htmlFor="enrol-employee" className={labelCls}>Employee <span className="text-red-500">*</span></label>
            <Select
              id="enrol-employee"
              name="employee_id"
              options={employees.map((e) => {
                const enrolled = alreadyEnrolled.has(e.id);
                return {
                  value: e.id,
                  label: `${e.full_name}${enrolled ? " (already enrolled)" : ""}`,
                  disabled: enrolled,
                };
              })}
            />
          </div>

          <div>
            <label htmlFor="enrol-start-date" className={labelCls}>Start date</label>
            <DatePicker id="enrol-start-date" name="start_date" defaultValue={new Date().toISOString().split("T")[0]} placeholder="Select start date" />
          </div>

          <div>
            <label htmlFor="enrol-notes" className={labelCls}>Notes</label>
            <textarea
              id="enrol-notes"
              name="notes"
              className="flex min-h-[60px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Any enrolment notes…"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {isPending ? "Enrolling…" : "Enrol employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  enrolledCount,
  isAdmin,
}: {
  plan: BenefitPlan;
  enrolledCount: number;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const pt = getPlanType(plan.type);
  const days = daysUntil(plan.renewal_date);
  const renewingSoon = days !== null && days >= 0 && days <= 60;
  const totalContrib = plan.employer_contribution + plan.employee_contribution;
  const employerPct = totalContrib > 0 ? (plan.employer_contribution / totalContrib) * 100 : 50;

  function handleStatus(status: "active" | "inactive" | "archived") {
    setMenuOpen(false);
    startTransition(() => { void updatePlanStatus(plan.id, status); });
  }

  function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    startTransition(() => { void deletePlan(plan.id); });
  }

  return (
    <div className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all ${isPending ? "opacity-60" : "border-navy-200 hover:shadow-sm"}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${pt.color.replace("text-", "text-").split(" ")[0]}`}>
            {pt.icon}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 text-sm leading-tight">{plan.name}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pt.color}`}>{pt.label}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="relative">
            <button
              type="button"
              aria-label="Plan actions"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-navy-200 rounded-xl shadow-lg py-1 w-40 text-sm">
                  {plan.status === "active" ? (
                    <button type="button" onClick={() => handleStatus("inactive")} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">
                      Set inactive
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleStatus("active")} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">
                      Set active
                    </button>
                  )}
                  <button type="button" onClick={() => handleStatus("archived")} className="w-full text-left px-4 py-2 hover:bg-navy-50 text-navy-700 transition-colors">
                    Archive
                  </button>
                  <div className="border-t border-navy-100 my-1" />
                  <button type="button" onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Provider + status */}
      <div className="flex items-center gap-2 flex-wrap">
        {plan.provider && (
          <span className="text-xs text-navy-500 bg-navy-50 px-2 py-0.5 rounded-full">{plan.provider}</span>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.status === "active" ? "bg-green-100 text-green-700" : "bg-navy-100 text-navy-500"}`}>
          {plan.status === "active" ? "Active" : "Inactive"}
        </span>
        {renewingSoon && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Renews in {days}d
          </span>
        )}
      </div>

      {plan.description && (
        <p className="text-xs text-navy-500 leading-relaxed line-clamp-2">{plan.description}</p>
      )}

      {/* Contribution split bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-navy-500 mb-1.5">
          <span>Employer {fmt(plan.employer_contribution, plan.currency)}</span>
          <span>Employee {fmt(plan.employee_contribution, plan.currency)}</span>
        </div>
        <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${employerPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-navy-400 mt-1">
          <span>Employer</span>
          <span>Employee</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-navy-100">
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span><strong className="text-navy-800">{enrolledCount}</strong> enrolled</span>
        </div>
        {plan.renewal_date && (
          <span className="text-xs text-navy-400">
            Renews {new Date(plan.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Enrolment Status Select ──────────────────────────────────────────────────

function EnrolmentStatusSelect({ enrolment }: { enrolment: BenefitEnrolment }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(enrolment.status);

  function handleChange(value: string) {
    const next = value as BenefitEnrolment["status"];
    setStatus(next);
    startTransition(() => { void updateEnrolmentStatus(enrolment.id, next); });
  }

  const cfg = ENROLMENT_STATUS[status] ?? ENROLMENT_STATUS.active;

  return (
    <Select
      aria-label="Enrolment status"
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className="w-32"
      triggerClassName={`h-7 rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${cfg.cls} ${isPending ? "opacity-60" : ""}`}
      options={Object.entries(ENROLMENT_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
    />
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

type Tab = "plans" | "enrolments";

export function BenefitsClient({ plans, enrolments, employees, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>("plans");
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEnrol, setShowEnrol] = useState(false);
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── Stats ──
  const activePlans = plans.filter((p) => p.status === "active").length;
  const activeEnrolments = enrolments.filter((e) => e.status === "active").length;
  const renewingInDays = plans.filter((p) => {
    const d = daysUntil(p.renewal_date);
    return d !== null && d >= 0 && d <= 60;
  }).length;
  const enrolledCountByPlan: Record<string, number> = {};
  for (const e of enrolments) {
    if (e.status === "active") enrolledCountByPlan[e.plan_id] = (enrolledCountByPlan[e.plan_id] ?? 0) + 1;
  }

  // ── Filtered enrolments ──
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

  const filteredEnrolments = enrolments.filter((e) => {
    if (filterPlan !== "all" && e.plan_id !== filterPlan) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  return (
    <>
      {showCreatePlan && <CreatePlanModal onClose={() => setShowCreatePlan(false)} />}
      {showEnrol && (
        <EnrolModal
          plans={plans}
          employees={employees}
          enrolments={enrolments}
          onClose={() => setShowEnrol(false)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active plans",       value: activePlans },
          { label: "Active enrolments",  value: activeEnrolments },
          { label: "Eligible employees", value: employees.length },
          { label: "Renewing ≤ 60 days", value: renewingInDays, warn: renewingInDays > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-navy-200 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.warn ? "text-amber-600" : "text-navy-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 border-b border-navy-200">
          {(["plans", "enrolments"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px capitalize ${
                tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-navy-500 hover:text-navy-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEnrol(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium border border-navy-200 bg-white hover:bg-navy-50 text-navy-700 px-3 py-2 rounded-xl transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Enrol employee
            </button>
            <button
              type="button"
              onClick={() => setShowCreatePlan(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add plan
            </button>
          </div>
        )}
      </div>

      {/* ── Plans tab ── */}
      {tab === "plans" && (
        <>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  enrolledCount={enrolledCountByPlan[plan.id] ?? 0}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🏥"
              title="No benefit plans yet"
              sub={isAdmin ? "Add your first plan to start managing employee benefits." : "No benefit plans have been set up yet."}
              action={isAdmin ? { label: "Add plan", onClick: () => setShowCreatePlan(true) } : undefined}
            />
          )}
        </>
      )}

      {/* ── Enrolments tab ── */}
      {tab === "enrolments" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Select
              aria-label="Filter by plan"
              value={filterPlan}
              onChange={setFilterPlan}
              className="w-full sm:w-44"
              triggerClassName="h-9 text-navy-700"
              options={[{ value: "all", label: "All plans" }, ...plans.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full sm:w-44"
              triggerClassName="h-9 text-navy-700"
              options={[{ value: "all", label: "All statuses" }, ...Object.entries(ENROLMENT_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]}
            />
            <span className="sm:ml-auto text-sm text-navy-500 self-center">
              {filteredEnrolments.length} enrolment{filteredEnrolments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredEnrolments.length > 0 ? (
            <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50 border-b border-navy-200 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                <div className="col-span-4">Employee</div>
                <div className="col-span-3">Plan</div>
                <div className="col-span-2 hidden md:block">Start date</div>
                <div className="col-span-3 sm:col-span-2">Status</div>
              </div>
              <div className="divide-y divide-navy-100">
                {filteredEnrolments.map((enrolment) => {
                  const emp = empMap[enrolment.employee_id];
                  const plan = planMap[enrolment.plan_id];
                  const pt = plan ? getPlanType(plan.type) : null;
                  return (
                    <div key={enrolment.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-navy-50/50 transition-colors">
                      <div className="col-span-4 min-w-0">
                        {emp ? (
                          <>
                            <p className="text-sm font-semibold text-navy-800 truncate">{emp.full_name}</p>
                            <p className="text-xs text-navy-400 truncate">{emp.job_title ?? emp.department ?? "—"}</p>
                          </>
                        ) : (
                          <p className="text-sm text-navy-400 italic">Unknown employee</p>
                        )}
                      </div>
                      <div className="col-span-3 min-w-0">
                        {plan && pt ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{pt.icon}</span>
                            <span className="text-sm text-navy-700 truncate">{plan.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-navy-400 italic">Removed</span>
                        )}
                      </div>
                      <div className="col-span-2 hidden md:block text-sm text-navy-500">
                        {enrolment.start_date
                          ? new Date(enrolment.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        {isAdmin ? (
                          <EnrolmentStatusSelect enrolment={enrolment} />
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ENROLMENT_STATUS[enrolment.status]?.cls ?? ""}`}>
                            {ENROLMENT_STATUS[enrolment.status]?.label ?? enrolment.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="📋"
              title="No enrolments found"
              sub={enrolments.length === 0 ? "Enrol employees in benefit plans to track coverage." : "Try adjusting your filters."}
              action={isAdmin && enrolments.length === 0 ? { label: "Enrol employee", onClick: () => setShowEnrol(true) } : undefined}
            />
          )}
        </>
      )}
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: string;
  title: string;
  sub: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-navy-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-navy-500 mb-5">{sub}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
