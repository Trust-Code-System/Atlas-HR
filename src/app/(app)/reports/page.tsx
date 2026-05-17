import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { ReportsClient } from "./reports-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const orgId = orgCtx.org.id;

  // Fetch all data needed for reports
  const [
    { data: employees },
    { data: leaveRequests },
    { data: payrollRuns },
    { data: payrollEntries },
    { data: jobs },
    { data: applications },
    { data: timeEntries },
    { data: performanceCycles },
    { data: reviews },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("org_id", orgId),
    supabase.from("leave_requests").select("*"),
    supabase.from("payroll_runs").select("*").eq("org_id", orgId),
    supabase.from("payroll_entries").select("*"),
    supabase.from("jobs").select("*").eq("org_id", orgId),
    supabase.from("job_applications").select("*"),
    supabase.from("time_entries").select("*").eq("org_id", orgId),
    supabase.from("performance_cycles").select("*").eq("org_id", orgId),
    supabase.from("performance_reviews").select("*"),
  ]);

  const allEmployees = employees ?? [];
  const empIds = allEmployees.map((e) => e.id);

  // Filter cross-table data to org employees
  const orgLeave = (leaveRequests ?? []).filter((l) => empIds.includes(l.employee_id));
  const jobIds = (jobs ?? []).map((j) => j.id);
  const orgApplications = (applications ?? []).filter((a) => jobIds.includes(a.job_id));

  const cycleIds = (performanceCycles ?? []).map((c) => c.id);
  const orgReviews = (reviews ?? []).filter((r) => cycleIds.includes(r.cycle_id));

  // Payroll: entries that belong to org employees
  const orgPayrollEntries = (payrollEntries ?? []).filter((e) => empIds.includes(e.employee_id));

  return (
    <ReportsClient
      employees={allEmployees}
      leaveRequests={orgLeave}
      payrollRuns={payrollRuns ?? []}
      payrollEntries={orgPayrollEntries}
      jobs={jobs ?? []}
      applications={orgApplications}
      timeEntries={timeEntries ?? []}
      performanceCycles={performanceCycles ?? []}
      reviews={orgReviews}
      orgName={orgCtx.org.name}
    />
  );
}
