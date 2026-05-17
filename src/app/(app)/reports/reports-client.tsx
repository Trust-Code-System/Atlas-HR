"use client";

import type { Employee, LeaveRequest, PayrollRun, PayrollEntry, Job, JobApplication, TimeEntry, PerformanceCycle, PerformanceReview } from "@/types/database";

interface Props {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  payrollRuns: PayrollRun[];
  payrollEntries: PayrollEntry[];
  jobs: Job[];
  applications: JobApplication[];
  timeEntries: TimeEntry[];
  performanceCycles: PerformanceCycle[];
  reviews: PerformanceReview[];
  orgName: string;
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-1">{label}</p>
      <p className="font-mono text-3xl font-bold text-navy-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-navy-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, onExport }: { title: string; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-navy-900">{title}</h2>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-600 hover:text-blue-700 border border-navy-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}

function SimpleBar({ label, value, max, color = "bg-blue-500" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-navy-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-navy-700 w-8 text-right">{value}</span>
    </div>
  );
}

export function ReportsClient({
  employees,
  leaveRequests,
  payrollRuns,
  payrollEntries,
  jobs,
  applications,
  timeEntries,
  performanceCycles,
  reviews,
  orgName,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  // ── Headcount ──
  const active = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on_leave").length;
  const terminated = employees.filter((e) => e.status === "terminated").length;

  const deptCounts: Record<string, number> = {};
  for (const e of employees.filter((e) => e.status === "active")) {
    const dept = e.department ?? "Unassigned";
    deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
  }
  const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

  // ── Leave ──
  const approvedLeave = leaveRequests.filter((l) => l.status === "approved");
  const pendingLeave = leaveRequests.filter((l) => l.status === "pending");
  const leaveDays = approvedLeave.reduce((sum, l) => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    return sum + Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  }, 0);

  // ── Payroll ──
  const paidRuns = payrollRuns.filter((r) => r.status === "paid");
  const totalGross = paidRuns.reduce((sum, r) => sum + (r.total_gross ?? 0), 0);
  const totalNet = paidRuns.reduce((sum, r) => sum + (r.total_net ?? 0), 0);

  // ── Recruiting ──
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const hired = applications.filter((a) => a.stage === "hired").length;
  const hireRate = applications.length > 0 ? Math.round((hired / applications.length) * 100) : 0;

  // ── Time ──
  const approvedHours = timeEntries.filter((t) => t.status === "approved").reduce((sum, t) => sum + (t.hours ?? 0), 0);
  const pendingHours = timeEntries.filter((t) => t.status === "submitted").reduce((sum, t) => sum + (t.hours ?? 0), 0);

  // ── Performance ──
  const activeCycles = performanceCycles.filter((c) => c.status === "active").length;
  const submittedReviews = reviews.filter((r) => r.status === "submitted").length;
  const avgRating = reviews.filter((r) => r.rating != null).length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.filter((r) => r.rating != null).length).toFixed(1)
    : "—";

  // Export functions
  function exportPeople() {
    downloadCSV(
      `${orgName}-people-${today}.csv`,
      employees.map((e) => [
        e.full_name, e.email ?? "", e.job_title ?? "", e.department ?? "",
        e.status, e.employment_type ?? "", e.start_date ?? "", e.country ?? "",
      ]),
      ["Name", "Email", "Job Title", "Department", "Status", "Type", "Start Date", "Country"]
    );
  }

  function exportLeave() {
    const empMap = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));
    downloadCSV(
      `${orgName}-leave-${today}.csv`,
      leaveRequests.map((l) => [
        empMap[l.employee_id] ?? l.employee_id,
        l.leave_type, l.start_date, l.end_date,
        l.status, l.reason ?? "",
      ]),
      ["Employee", "Leave Type", "Start", "End", "Status", "Notes"]
    );
  }

  function exportPayroll() {
    const empMap = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));
    const runMap = Object.fromEntries(payrollRuns.map((r) => [r.id, r.name]));
    downloadCSV(
      `${orgName}-payroll-${today}.csv`,
      payrollEntries.map((e) => [
        runMap[e.run_id] ?? e.run_id,
        empMap[e.employee_id] ?? e.employee_id,
        String(e.gross_pay ?? ""), String(e.net_pay ?? ""),
        String(e.deductions ?? ""),
      ]),
      ["Payroll Run", "Employee", "Gross Pay", "Net Pay", "Deductions"]
    );
  }

  function exportRecruiting() {
    const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));
    downloadCSV(
      `${orgName}-recruiting-${today}.csv`,
      applications.map((a) => [
        jobMap[a.job_id] ?? a.job_id,
        a.candidate_name, a.candidate_email ?? "",
        a.stage ?? "", a.created_at ?? "",
      ]),
      ["Job", "Candidate", "Email", "Stage", "Applied At"]
    );
  }

  function exportTime() {
    const empMap = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));
    downloadCSV(
      `${orgName}-time-${today}.csv`,
      timeEntries.map((t) => [
        empMap[t.employee_id] ?? t.employee_id,
        t.date, String(t.hours), t.category, t.status, t.notes ?? "",
      ]),
      ["Employee", "Date", "Hours", "Category", "Status", "Notes"]
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports</h1>
            <p className="text-blue-300 text-sm mt-0.5">{orgName} · All modules</p>
          </div>
        </div>
      </div>

      {/* Headcount */}
      <section className="mb-8">
        <SectionHeader title="Headcount" onExport={exportPeople} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total employees" value={employees.length} />
          <StatCard label="Active" value={active} />
          <StatCard label="On leave" value={onLeave} />
          <StatCard label="Terminated" value={terminated} />
        </div>
        {deptEntries.length > 0 && (
          <div className="bg-white rounded-2xl border border-navy-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-4">By department</p>
            <div className="space-y-2.5">
              {deptEntries.map(([dept, count]) => (
                <SimpleBar key={dept} label={dept} value={count} max={maxDeptCount} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Leave */}
      <section className="mb-8">
        <SectionHeader title="Leave" onExport={exportLeave} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Approved requests" value={approvedLeave.length} sub={`${leaveDays} days taken`} />
          <StatCard label="Pending approval" value={pendingLeave.length} />
          <StatCard label="Total requests" value={leaveRequests.length} />
        </div>
      </section>

      {/* Payroll */}
      <section className="mb-8">
        <SectionHeader title="Payroll" onExport={exportPayroll} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Paid runs" value={paidRuns.length} />
          <StatCard label="Total gross" value={`£${totalGross.toLocaleString()}`} />
          <StatCard label="Total net" value={`£${totalNet.toLocaleString()}`} />
          <StatCard label="Deductions" value={`£${(totalGross - totalNet).toLocaleString()}`} />
        </div>
      </section>

      {/* Recruiting */}
      <section className="mb-8">
        <SectionHeader title="Recruiting" onExport={exportRecruiting} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Open roles" value={openJobs} />
          <StatCard label="Total applicants" value={applications.length} />
          <StatCard label="Hired" value={hired} />
          <StatCard label="Hire rate" value={`${hireRate}%`} />
        </div>
      </section>

      {/* Time */}
      <section className="mb-8">
        <SectionHeader title="Time Tracking" onExport={exportTime} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Approved hours" value={`${approvedHours}h`} />
          <StatCard label="Pending approval" value={`${pendingHours}h`} />
          <StatCard label="Total entries" value={timeEntries.length} />
        </div>
      </section>

      {/* Performance */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-navy-900">Performance</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Active cycles" value={activeCycles} />
          <StatCard label="Submitted reviews" value={submittedReviews} />
          <StatCard label="Avg rating" value={avgRating} sub="out of 5" />
        </div>
      </section>
    </div>
  );
}
