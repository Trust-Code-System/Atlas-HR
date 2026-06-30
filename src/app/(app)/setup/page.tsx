import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Setup Guide | Atlas HR" };

type SetupStep = {
  title: string;
  detail: string;
  href: string;
  action: string;
  done: boolean;
  optional?: boolean;
};

function statusLabel(step: SetupStep) {
  if (step.done) return step.optional ? "Added" : "Done";
  return step.optional ? "Optional" : "Next";
}

function statusClass(step: SetupStep) {
  if (step.done) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (step.optional) return "border-navy-200 bg-navy-50 text-navy-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function SetupPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const orgId = orgCtx.org.id;

  const [members, employees, policies, documentTemplates, payrollRuns, benefitPlans] = await Promise.all([
    dataOrEmpty(supabase.from("org_members").select("id, roles, org_role").eq("org_id", orgId)),
    dataOrEmpty(supabase.from("employees").select("id").eq("org_id", orgId).limit(2)),
    dataOrEmpty(supabase.from("policy_library").select("id, category").eq("org_id", orgId).limit(5)),
    dataOrEmpty(supabase.from("document_requirement_templates").select("id").eq("org_id", orgId).limit(2)),
    dataOrEmpty(supabase.from("payroll_runs").select("id").eq("org_id", orgId).limit(1)),
    dataOrEmpty(supabase.from("benefit_plans").select("id").eq("org_id", orgId).limit(1)),
  ]);

  const hrMembers = members.filter((member) => {
    const roles = Array.isArray(member.roles) ? member.roles : [];
    return member.org_role === "admin" || roles.some((role) => ["workspace_owner", "hr_admin", "hr_manager"].includes(role));
  });

  const companyDetailsDone = Boolean(orgCtx.org.industry || orgCtx.org.country || orgCtx.org.size);
  const hasLeavePolicy = policies.some((policy) => policy.category === "leave");

  const steps: SetupStep[] = [
    {
      title: "Company details",
      detail: "Set the company country, size, industry, and basic workspace identity.",
      href: "/settings/org",
      action: "Update company details",
      done: companyDetailsDone,
    },
    {
      title: "Invite HR team",
      detail: "Give each HR teammate their own login and role. They should not share one account.",
      href: "/settings/team",
      action: "Invite HR team",
      done: hrMembers.length > 1,
    },
    {
      title: "Add or import employees",
      detail: "Create employee records so My Portal, leave, documents, payslips, and benefits can connect to real people.",
      href: employees.length > 0 ? "/org/people" : "/org/people/import",
      action: employees.length > 0 ? "Review employees" : "Import employees",
      done: employees.length > 0,
    },
    {
      title: "Configure leave policy",
      detail: "Add the company leave policy and use Leave to review employee time-off requests.",
      href: hasLeavePolicy ? "/org/leave" : "/org/library/new",
      action: hasLeavePolicy ? "Open leave" : "Add leave policy",
      done: hasLeavePolicy,
    },
    {
      title: "Upload documents",
      detail: "Add document requirements and policies so HR can track missing, submitted, expiring, and approved records.",
      href: "/org/library",
      action: documentTemplates.length > 0 ? "Review document library" : "Add document templates",
      done: documentTemplates.length > 0,
    },
    {
      title: "Payroll and benefits",
      detail: "Optional: add payroll runs and benefit plans once your employee records are ready.",
      href: payrollRuns.length > 0 || benefitPlans.length > 0 ? "/payroll" : "/benefits",
      action: payrollRuns.length > 0 || benefitPlans.length > 0 ? "Review finance setup" : "Add benefits",
      done: payrollRuns.length > 0 || benefitPlans.length > 0,
      optional: true,
    },
  ];

  const requiredSteps = steps.filter((step) => !step.optional);
  const completedRequired = requiredSteps.filter((step) => step.done).length;
  const progress = Math.round((completedRequired / requiredSteps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
        <div className="bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-300">Company setup</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Start running {orgCtx.org.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Follow this sequence once after creating the company account. Admin pages control the company; My pages are personal employee self-service.
              </p>
            </div>
            <div className="min-w-36 rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="font-mono text-3xl font-semibold">{progress}%</p>
              <p className="mt-1 text-xs font-medium text-blue-200">required setup complete</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-navy-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 font-mono text-sm font-semibold text-blue-700">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-navy-950">{step.title}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(step)}`}>
                      {statusLabel(step)}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-navy-500">{step.detail}</p>
                </div>
              </div>
              <Link
                href={step.href}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                {step.action}
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/requests" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 transition-colors hover:bg-blue-100">
          <p className="text-sm font-bold text-blue-950">Use HR Inbox after setup</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Leave, complaints, profile changes, document issues, onboarding tasks, payroll, and benefits all roll up there.
          </p>
        </Link>
        <Link href="/settings/audit-log" className="rounded-2xl border border-navy-200 bg-white p-5 transition-colors hover:bg-navy-50">
          <p className="text-sm font-bold text-navy-950">Audit sensitive HR work</p>
          <p className="mt-1 text-sm leading-6 text-navy-500">
            Review who approved, changed, uploaded, deleted, or handled sensitive records.
          </p>
        </Link>
      </section>
    </div>
  );
}
