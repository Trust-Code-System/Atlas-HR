import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "HR Inbox | Atlas HR" };

type EmployeeLite = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  start_date?: string | null;
};

type InboxItem = {
  id: string;
  type: string;
  title: string;
  person: string;
  detail: string;
  status: string;
  href: string;
  createdAt: string;
  priority: "urgent" | "high" | "normal";
};

const TYPE_STYLE: Record<string, string> = {
  Leave: "border-amber-200 bg-amber-50 text-amber-700",
  Complaint: "border-red-200 bg-red-50 text-red-700",
  Documents: "border-blue-200 bg-blue-50 text-blue-700",
  "Profile change": "border-violet-200 bg-violet-50 text-violet-700",
  Onboarding: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Payroll: "border-rose-200 bg-rose-50 text-rose-700",
  Benefits: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function priorityRank(priority: InboxItem["priority"]) {
  if (priority === "urgent") return 0;
  if (priority === "high") return 1;
  return 2;
}

function employeeName(map: Record<string, EmployeeLite>, employeeId: string | null | undefined) {
  if (!employeeId) return "Unassigned";
  return map[employeeId]?.full_name ?? "Unknown employee";
}

export default async function RequestsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const orgId = orgCtx.org.id;

  const employees = await dataOrEmpty(
    supabase
      .from("employees")
      .select("id, full_name, job_title, department, start_date")
      .eq("org_id", orgId)
      .order("full_name", { ascending: true })
  );

  const employeeIds = employees.map((employee) => employee.id);
  const employeeMap = Object.fromEntries(employees.map((employee) => [employee.id, employee as EmployeeLite]));

  const [
    leaveRequests,
    complaints,
    profileChanges,
    documentStatuses,
    employeeTasks,
    payrollRuns,
    benefitEnrolments,
  ] = await Promise.all([
    employeeIds.length
      ? dataOrEmpty(
          supabase
            .from("leave_requests")
            .select("id, employee_id, leave_type, start_date, end_date, status, created_at")
            .in("employee_id", employeeIds)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(50)
        )
      : Promise.resolve([]),
    dataOrEmpty(
      supabase
        .from("complaints")
        .select("id, reporter_employee_id, subject_employee_id, title, category, severity, status, created_at")
        .eq("org_id", orgId)
        .not("status", "in", "(resolved,closed)")
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    dataOrEmpty(
      supabase
        .from("employee_profile_change_requests")
        .select("id, employee_id, status, created_at")
        .eq("org_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    employeeIds.length
      ? dataOrEmpty(
          supabase
            .from("employee_document_status")
            .select("id, employee_id, doc_type, status, last_checked_at")
            .in("employee_id", employeeIds)
            .in("status", ["missing", "submitted", "expired", "expiring_soon"])
            .limit(80)
        )
      : Promise.resolve([]),
    dataOrEmpty(
      supabase
        .from("employee_tasks")
        .select("id, employee_id, title, task_type, status, due_at, created_at")
        .eq("org_id", orgId)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    dataOrEmpty(
      supabase
        .from("payroll_runs")
        .select("id, name, status, pay_period_end, created_at")
        .eq("org_id", orgId)
        .in("status", ["draft", "processing"])
        .order("created_at", { ascending: false })
        .limit(20)
    ),
    dataOrEmpty(
      supabase
        .from("benefit_enrolments")
        .select("id, employee_id, status, created_at")
        .eq("org_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(30)
    ),
  ]);

  const items: InboxItem[] = [
    ...leaveRequests.map((request) => ({
      id: `leave-${request.id}`,
      type: "Leave",
      title: `${request.leave_type.replace(/_/g, " ")} leave request`,
      person: employeeName(employeeMap, request.employee_id),
      detail: `${formatDate(request.start_date)} to ${formatDate(request.end_date)}`,
      status: request.status,
      href: "/org/leave?status=pending",
      createdAt: request.created_at,
      priority: "high" as const,
    })),
    ...complaints.map((complaint) => ({
      id: `complaint-${complaint.id}`,
      type: "Complaint",
      title: complaint.title,
      person: complaint.reporter_employee_id ? employeeName(employeeMap, complaint.reporter_employee_id) : "Anonymous or external report",
      detail: `${complaint.category} case - ${complaint.severity} severity`,
      status: complaint.status,
      href: "/complaints",
      createdAt: complaint.created_at,
      priority: complaint.severity === "high" || complaint.severity === "critical" ? "urgent" as const : "high" as const,
    })),
    ...profileChanges.map((change) => ({
      id: `profile-${change.id}`,
      type: "Profile change",
      title: "Employee profile change needs review",
      person: employeeName(employeeMap, change.employee_id),
      detail: "Employee submitted changes to personal or work profile data.",
      status: change.status,
      href: "/tasks",
      createdAt: change.created_at,
      priority: "normal" as const,
    })),
    ...documentStatuses.map((doc) => ({
      id: `doc-${doc.id}`,
      type: "Documents",
      title: `${doc.doc_type.replace(/_/g, " ")} document is ${doc.status.replace(/_/g, " ")}`,
      person: employeeName(employeeMap, doc.employee_id),
      detail: "Track missing, submitted, expiring, or expired employee documents.",
      status: doc.status,
      href: `/org/people/${doc.employee_id}`,
      createdAt: doc.last_checked_at ?? new Date().toISOString(),
      priority: doc.status === "expired" || doc.status === "missing" ? "high" as const : "normal" as const,
    })),
    ...employeeTasks.map((task) => ({
      id: `task-${task.id}`,
      type: task.task_type === "onboarding" ? "Onboarding" : "Documents",
      title: task.title,
      person: employeeName(employeeMap, task.employee_id),
      detail: task.due_at ? `Due ${formatDate(task.due_at)}` : `${task.task_type.replace(/_/g, " ")} task`,
      status: task.status,
      href: "/tasks",
      createdAt: task.created_at,
      priority: task.due_at && new Date(task.due_at) < new Date() ? "high" as const : "normal" as const,
    })),
    ...payrollRuns.map((run) => ({
      id: `payroll-${run.id}`,
      type: "Payroll",
      title: `${run.name} needs payroll attention`,
      person: "Finance",
      detail: `Pay period ending ${formatDate(run.pay_period_end)}`,
      status: run.status,
      href: "/payroll",
      createdAt: run.created_at,
      priority: "high" as const,
    })),
    ...benefitEnrolments.map((enrolment) => ({
      id: `benefit-${enrolment.id}`,
      type: "Benefits",
      title: "Benefit enrolment pending",
      person: employeeName(employeeMap, enrolment.employee_id),
      detail: "Review and activate the employee benefit enrolment.",
      status: enrolment.status,
      href: "/benefits",
      createdAt: enrolment.created_at,
      priority: "normal" as const,
    })),
  ].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const counts = {
    total: items.length,
    urgent: items.filter((item) => item.priority === "urgent").length,
    approvals: leaveRequests.length + payrollRuns.length,
    people: profileChanges.length + documentStatuses.length + employeeTasks.length + benefitEnrolments.length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 text-white shadow-xl">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-300">Operations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">HR Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              One place for HR admins and managers to review employee requests, sensitive cases, document follow-up, onboarding tasks, payroll, and benefits.
            </p>
          </div>
          <Link
            href="/settings/audit-log"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-blue-50"
          >
            View audit trail
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open items", value: counts.total, tone: "text-blue-700 bg-blue-50 border-blue-100" },
          { label: "Urgent cases", value: counts.urgent, tone: "text-red-700 bg-red-50 border-red-100" },
          { label: "Approvals", value: counts.approvals, tone: "text-amber-700 bg-amber-50 border-amber-100" },
          { label: "People follow-up", value: counts.people, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-4 ${metric.tone}`}>
            <p className="text-xs font-bold uppercase tracking-[0.08em] opacity-75">{metric.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-sm">
        {items.length > 0 ? (
          <div className="divide-y divide-navy-100">
            {items.map((item) => (
              <Link key={item.id} href={item.href} className="block px-5 py-4 transition-colors hover:bg-blue-50/50">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${TYPE_STYLE[item.type] ?? "border-navy-200 bg-navy-50 text-navy-600"}`}>
                        {item.type}
                      </span>
                      <span className="rounded-full border border-navy-200 bg-white px-2.5 py-1 text-[11px] font-bold capitalize text-navy-500">
                        {item.status.replace(/_/g, " ")}
                      </span>
                      {item.priority === "urgent" && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 truncate text-sm font-bold text-navy-950">{item.title}</h2>
                    <p className="mt-1 text-sm text-navy-500">{item.person} - {item.detail}</p>
                  </div>
                  <p className="shrink-0 font-mono text-xs text-navy-400">{formatDate(item.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 6V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" />
              </svg>
            </div>
            <h2 className="mt-4 text-base font-bold text-navy-950">No open HR requests</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-navy-500">
              Leave requests, complaints, document follow-up, profile changes, onboarding tasks, payroll drafts, and benefit questions will appear here when employees or HR create them.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/org/leave" className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
                Open Leave
              </Link>
              <Link href="/complaints" className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
                Open Complaints
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
