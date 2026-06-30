import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { BenefitEnrolment, BenefitPlan } from "@/types/database";
import { AccountLinkNotice } from "../account-link-notice";

export const metadata: Metadata = { title: "My Benefits | Atlas HR" };

const PLAN_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  health:  { label: "Health",  icon: "🏥", color: "bg-rose-100 text-rose-700" },
  dental:  { label: "Dental",  icon: "🦷", color: "bg-blue-100 text-blue-700" },
  vision:  { label: "Vision",  icon: "👁️",  color: "bg-purple-100 text-purple-700" },
  pension: { label: "Pension", icon: "🏦", color: "bg-amber-100 text-amber-700" },
  life:    { label: "Life",    icon: "🛡️",  color: "bg-green-100 text-green-700" },
  other:   { label: "Other",   icon: "📋", color: "bg-navy-100 text-navy-600" },
};

const ENROLMENT_STATUS: Record<string, { label: string; cls: string }> = {
  active:     { label: "Active",     cls: "bg-green-100 text-green-700" },
  pending:    { label: "Pending",    cls: "bg-amber-100 text-amber-700" },
  opted_out:  { label: "Opted out",  cls: "bg-navy-100 text-navy-500" },
  terminated: { label: "Terminated", cls: "bg-red-100 text-red-600" },
};

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function PortalBenefitsPage() {
  const employee = await getMyEmployee();
  const orgData = await getCurrentOrg();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
        <AccountLinkNotice isAdmin={orgData?.isAdmin ?? false} orgName={orgData?.org.name ?? "this workspace"} />
      </div>
    );
  }

  const supabase = await createClient();

  const { data: enrolments } = await supabase
    .from("benefit_enrolments")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const allEnrolments = (enrolments ?? []) as BenefitEnrolment[];
  const planIds = [...new Set(allEnrolments.map((e) => e.plan_id))];

  const { data: plans } = planIds.length
    ? await supabase.from("benefit_plans").select("*").in("id", planIds)
    : { data: [] };

  const planMap: Record<string, BenefitPlan> = {};
  for (const p of plans ?? []) planMap[p.id] = p as BenefitPlan;

  const activeCount = allEnrolments.filter((e) => e.status === "active").length;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">My Benefits</h1>
              <p className="text-blue-300 text-sm mt-0.5">{employee.full_name}</p>
            </div>
          </div>
          {activeCount > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active plans</p>
              <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{activeCount}</p>
            </div>
          )}
        </div>
      </div>

      {allEnrolments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-200 p-12 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-navy-100 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">No benefit enrolments</h3>
          <p className="text-sm text-navy-500 max-w-xs mx-auto">
            You haven&apos;t been enrolled in any benefit plans yet. Contact your HR team to get set up.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allEnrolments.map((enrolment) => {
            const plan  = planMap[enrolment.plan_id];
            const meta  = PLAN_TYPE_META[plan?.type ?? "other"] ?? PLAN_TYPE_META.other;
            const st    = ENROLMENT_STATUS[enrolment.status] ?? ENROLMENT_STATUS.active;
            const total = (plan?.employer_contribution ?? 0) + (plan?.employee_contribution ?? 0);
            const empPct = total > 0 ? ((plan?.employer_contribution ?? 0) / total) * 100 : 50;
            const days   = daysUntil(plan?.renewal_date ?? null);
            const renewingSoon = days !== null && days >= 0 && days <= 60;

            return (
              <div key={enrolment.id} className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl ${meta.color.split(" ")[0]}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 text-sm leading-tight">
                        {plan?.name ?? "Unknown plan"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        {plan?.provider && (
                          <span className="text-xs text-navy-400">{plan.provider}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {renewingSoon && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        Renews in {days}d
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {plan?.description && (
                  <p className="text-sm text-navy-500 leading-relaxed mb-4">{plan.description}</p>
                )}

                {/* Contribution split */}
                {plan && (plan.employer_contribution > 0 || plan.employee_contribution > 0) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-navy-500 mb-1.5">
                      <span>Employer {fmt(plan.employer_contribution, plan.currency)}/mo</span>
                      <span>You {fmt(plan.employee_contribution, plan.currency)}/mo</span>
                    </div>
                    <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${empPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-navy-400 mt-1">
                      <span>Employer covers</span>
                      <span>Your share</span>
                    </div>
                  </div>
                )}

                {/* Footer meta */}
                <div className="flex items-center gap-4 text-xs text-navy-400 pt-3 border-t border-navy-100 flex-wrap">
                  {enrolment.start_date && (
                    <span>
                      Enrolled{" "}
                      {new Date(enrolment.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {plan?.renewal_date && (
                    <span>
                      Renews{" "}
                      {new Date(plan.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {enrolment.notes && (
                    <span className="italic">{enrolment.notes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
