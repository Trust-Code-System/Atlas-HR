import { AtlasAiMark } from "@/components/atlas-ai-mark";
import { Avatar } from "@/components/ui/avatar";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

type EmployeeRow = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  status: string | null;
  photo_url: string | null;
  start_date: string | null;
};

type LeaveRequestRow = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

type PayrollRunRow = {
  id: string;
  name: string;
  status: string;
  total_net: number | null;
  currency: string | null;
  pay_period_end: string | null;
  created_at: string;
};

type JobRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
  created_at: string;
};

type JobApplicationRow = {
  id: string;
  job_id: string;
  candidate_name: string;
  stage: string;
  applied_at: string;
};

type TimeEntryRow = {
  id: string;
  employee_id: string;
  date: string;
  hours: number;
  category: string;
  status: string;
};

type PerformanceCycleRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  end_date: string;
};

type PerformanceReviewRow = {
  id: string;
  cycle_id: string;
  employee_id: string;
  status: string;
  rating: number | null;
};

type SurveyRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  ends_at: string | null;
};

type SurveyResponseRow = {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  submitted_at: string;
};

type DocumentRow = {
  id: string;
  title: string;
  tool_slug: string | null;
  created_at: string;
};

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
const shortDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function greeting(name: string) {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]}`;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatMoney(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function buildSnapshot({
  pendingLeaveCount,
  onLeaveCount,
  newHiresCount,
  openJobsCount,
  candidatesCount,
  draftPayrollName,
  attendanceRate,
  activeEmployeeCount,
}: {
  pendingLeaveCount: number;
  onLeaveCount: number;
  newHiresCount: number;
  openJobsCount: number;
  candidatesCount: number;
  draftPayrollName: string | null;
  attendanceRate: number;
  activeEmployeeCount: number;
}): string {
  const facts: string[] = [];

  if (pendingLeaveCount > 0) {
    facts.push(`${pendingLeaveCount} leave request${pendingLeaveCount === 1 ? "" : "s"} pending approval`);
  }
  if (draftPayrollName) {
    facts.push(`${draftPayrollName} payroll awaiting sign-off`);
  }
  if (newHiresCount > 0) {
    facts.push(`${newHiresCount} new hire${newHiresCount === 1 ? "" : "s"} in the last 30 days`);
  }
  if (openJobsCount > 0) {
    facts.push(`${openJobsCount} open role${openJobsCount === 1 ? "" : "s"} · ${candidatesCount} candidate${candidatesCount === 1 ? "" : "s"} in pipeline`);
  }
  if (onLeaveCount > 0) {
    facts.push(`${onLeaveCount} employee${onLeaveCount === 1 ? "" : "s"} on leave today`);
  }
  if (pendingLeaveCount === 0 && !draftPayrollName) {
    facts.push("Approvals clear");
  }
  facts.push(`${attendanceRate}% attendance · ${activeEmployeeCount} active`);

  return facts.slice(0, 4).join(" · ");
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
}

function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

function RingProgress({ value, max, color = "#8b5cf6", size = 72 }: { value: number; max: number; color?: string; size?: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fraction = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = fraction * circ;
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" />
      <text x="36" y="33" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">{Math.round(fraction * 100)}%</text>
      <text x="36" y="44" textAnchor="middle" fontSize="7.5" fill="#64748b">complete</text>
    </svg>
  );
}

function MetricCard({
  title,
  value,
  helper,
  trend,
  href,
  iconPath,
  tone = "blue",
  sparkPoints,
}: {
  title: string;
  value: string;
  helper: string;
  trend?: string;
  href: string;
  iconPath: string;
  tone?: "blue" | "emerald" | "amber" | "rose" | "violet";
  sparkPoints?: number[];
}) {
  const cfg = {
    blue:    { icon: "from-blue-500 to-blue-600",    strip: "from-blue-400 to-blue-600",    spark: "#3b82f6" },
    emerald: { icon: "from-emerald-500 to-teal-500", strip: "from-emerald-400 to-teal-500", spark: "#10b981" },
    amber:   { icon: "from-amber-500 to-orange-500", strip: "from-amber-400 to-orange-500", spark: "#f59e0b" },
    rose:    { icon: "from-rose-500 to-pink-600",    strip: "from-rose-400 to-pink-500",    spark: "#f43f5e" },
    violet:  { icon: "from-violet-500 to-purple-600",strip: "from-violet-400 to-purple-500",spark: "#8b5cf6" },
  }[tone];

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${cfg.strip}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.icon} text-white shadow-sm`}>
          <Icon path={iconPath} />
        </div>
        {trend ? (
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
            {trend}
          </span>
        ) : (
          <Icon
            className="h-4 w-4 text-navy-300 transition-colors group-hover:text-blue-500"
            path="M9 5l7 7-7 7"
          />
        )}
      </div>
      <p className="mt-4 font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[13px] font-semibold text-navy-700">{title}</p>
      <p className="mt-0.5 text-xs leading-5 text-navy-400">{helper}</p>
      {sparkPoints && sparkPoints.length > 1 && (
        <div className="mt-3 opacity-40 transition-opacity group-hover:opacity-100">
          <MiniSparkline points={sparkPoints} color={cfg.spark} />
        </div>
      )}
    </Link>
  );
}

function MiniSparkline({ points, color = "#2563eb" }: { points: number[]; color?: string }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const polyline = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 36 - ((point - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible" aria-hidden="true">
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({
  segments,
  center,
  label,
}: {
  segments: Array<{ value: number; color: string; label: string }>;
  center: string;
  label: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.reduce<Array<{ segment: { value: number; color: string; label: string }; dash: number; offset: number }>>(
    (acc, segment) => {
      const offset = acc.reduce((sum, arc) => sum + arc.dash, 0);
      const dash = total > 0 ? (segment.value / total) * circumference : 0;
      return [...acc, { segment, dash, offset }];
    },
    []
  );

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {arcs.map(({ segment, dash, offset }) => {
          return (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              strokeWidth="16"
            />
          );
        })}
      </svg>
      <div className="min-w-0">
        <p className="font-mono text-3xl font-semibold text-navy-950 tabular-nums">{center}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">{label}</p>
        <div className="mt-4 space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2 text-xs text-navy-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="flex-1 truncate">{segment.label}</span>
              <span className="font-mono font-semibold text-navy-800">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MomentumChart({
  months,
  hires,
  leaveDays,
  payroll,
}: {
  months: string[];
  hires: number[];
  leaveDays: number[];
  payroll: number[];
}) {
  const width = 680;
  const height = 260;
  const left = 44;
  const right = 22;
  const top = 28;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxLine = Math.max(...hires, ...leaveDays, 1);
  const maxPayroll = Math.max(...payroll, 1);
  const x = (index: number) => left + (index / Math.max(months.length - 1, 1)) * chartWidth;
  const y = (value: number) => top + chartHeight - (value / maxLine) * chartHeight;
  const payrollBarHeight = (value: number) => (value / maxPayroll) * (chartHeight * 0.7);
  const hirePoints = hires.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const leavePoints = leaveDays.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const areaPoints = `${left},${top + chartHeight} ${hirePoints} ${left + chartWidth},${top + chartHeight}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full" role="img" aria-label="Workforce trend chart">
      {[0, 1, 2, 3].map((line) => {
        const lineY = top + (line / 3) * chartHeight;
        return (
          <g key={line}>
            <line x1={left} x2={width - right} y1={lineY} y2={lineY} stroke="#e2e8f0" strokeDasharray="4 6" />
            <text x="0" y={lineY + 4} className="fill-navy-400 text-[11px]">
              {Math.round(maxLine - (line / 3) * maxLine)}
            </text>
          </g>
        );
      })}

      {payroll.map((value, index) => {
        const barHeight = payrollBarHeight(value);
        const barWidth = Math.min(46, chartWidth / months.length - 10);
        return (
          <rect
            key={`${months[index]}-payroll`}
            x={x(index) - barWidth / 2}
            y={top + chartHeight - barHeight}
            width={barWidth}
            height={barHeight}
            rx="8"
            fill="#dbeafe"
          />
        );
      })}

      <polygon points={areaPoints} fill="url(#hiresArea)" opacity="0.9" />
      <polyline points={hirePoints} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={leavePoints} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {hires.map((value, index) => (
        <circle key={`${months[index]}-hire-dot`} cx={x(index)} cy={y(value)} r="5" fill="#2563eb" stroke="#fff" strokeWidth="3" />
      ))}

      {months.map((month, index) => (
        <text key={month} x={x(index)} y={height - 14} textAnchor="middle" className="fill-navy-400 text-[12px] font-medium">
          {month}
        </text>
      ))}

      <defs>
        <linearGradient id="hiresArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AttendanceBars({
  days,
}: {
  days: Array<{ label: string; regular: number; overtime: number; absent: number }>;
}) {
  const max = Math.max(...days.flatMap((day) => [day.regular + day.overtime + day.absent]), 1);

  return (
    <div className="grid h-52 grid-cols-7 items-end gap-3">
      {days.map((day) => {
        const regularHeight = Math.max(8, (day.regular / max) * 160);
        const overtimeHeight = day.overtime > 0 ? Math.max(6, (day.overtime / max) * 160) : 0;
        const absentHeight = day.absent > 0 ? Math.max(6, (day.absent / max) * 160) : 0;

        return (
          <div key={day.label} className="flex h-full flex-col items-center justify-end gap-2">
            <div className="flex w-full max-w-[36px] flex-col justify-end overflow-hidden rounded-full bg-navy-100">
              {absentHeight > 0 ? <div className="bg-rose-300" style={{ height: `${absentHeight}px` }} /> : null}
              {overtimeHeight > 0 ? <div className="bg-amber-300" style={{ height: `${overtimeHeight}px` }} /> : null}
              <div className="bg-blue-500" style={{ height: `${regularHeight}px` }} />
            </div>
            <span className="text-[11px] font-semibold text-navy-400">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeaveHeatmap({
  days,
}: {
  days: Array<{ day: number; count: number; isToday: boolean }>;
}) {
  const max = Math.max(...days.map((day) => day.count), 1);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
        <span key={`${day}-${index}`} className="mb-1 text-center text-[10px] font-bold text-navy-300">
          {day}
        </span>
      ))}
      {days.map((day) => {
        const intensity = day.count / max;
        const shade =
          day.count === 0
            ? "bg-navy-50 text-navy-300"
            : intensity > 0.66
              ? "bg-emerald-600 text-white"
              : intensity > 0.33
                ? "bg-emerald-300 text-emerald-950"
                : "bg-emerald-100 text-emerald-800";
        return (
          <div
            key={day.day}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold",
              shade,
              day.isToday && "ring-2 ring-blue-500 ring-offset-1"
            )}
          >
            {day.day}
          </div>
        );
      })}
    </div>
  );
}

function PipelineStage({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold capitalize text-navy-600">{label}</span>
        <span className="font-mono text-sm font-semibold text-navy-950">{count}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(8, pct(count, total))}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getUser();
  const supabase = await createClient();
  const orgData = await getCurrentOrg();
  const org = orgData?.org ?? null;
  const isAdmin = orgData?.isAdmin ?? false;
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const docsPromise = supabase
    .from("generated_documents")
    .select("id, title, tool_slug, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const [
    { data: docsData },
    { data: employeesData },
    { data: payrollRunsData },
    { data: jobsData },
    { data: timeEntriesData },
    { data: performanceCyclesData },
    { data: surveysData },
  ] = await Promise.all([
    docsPromise,
    org
      ? supabase
          .from("employees")
          .select("id, full_name, job_title, department, status, photo_url, start_date")
          .eq("org_id", org.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("payroll_runs")
          .select("id, name, status, total_net, currency, pay_period_end, created_at")
          .eq("org_id", org.id)
          .order("pay_period_end", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("jobs")
          .select("id, title, department, location, status, created_at")
          .eq("org_id", org.id)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("time_entries")
          .select("id, employee_id, date, hours, category, status")
          .eq("org_id", org.id)
          .gte("date", ninetyDaysAgo.toISOString().slice(0, 10))
          .order("date", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("performance_cycles")
          .select("id, name, status, type, end_date")
          .eq("org_id", org.id)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("surveys")
          .select("id, title, type, status, ends_at")
          .eq("org_id", org.id)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  const docs = (docsData ?? []) as DocumentRow[];
  const employees = (employeesData ?? []) as EmployeeRow[];
  const payrollRuns = (payrollRunsData ?? []) as PayrollRunRow[];
  const jobs = (jobsData ?? []) as JobRow[];
  const timeEntries = (timeEntriesData ?? []) as TimeEntryRow[];
  const performanceCycles = (performanceCyclesData ?? []) as PerformanceCycleRow[];
  const surveys = (surveysData ?? []) as SurveyRow[];
  const employeeIds = employees.map((employee) => employee.id);
  const jobIds = jobs.map((job) => job.id);
  const cycleIds = performanceCycles.map((cycle) => cycle.id);
  const surveyIds = surveys.map((survey) => survey.id);

  const [
    { data: leaveRequestsData },
    { data: jobApplicationsData },
    { data: performanceReviewsData },
    { data: surveyResponsesData },
  ] = await Promise.all([
    employeeIds.length
      ? supabase
          .from("leave_requests")
          .select("id, employee_id, leave_type, start_date, end_date, status, created_at")
          .in("employee_id", employeeIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    jobIds.length
      ? supabase
          .from("job_applications")
          .select("id, job_id, candidate_name, stage, applied_at")
          .in("job_id", jobIds)
          .order("applied_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] }),
    cycleIds.length
      ? supabase
          .from("performance_reviews")
          .select("id, cycle_id, employee_id, status, rating")
          .in("cycle_id", cycleIds)
          .limit(300)
      : Promise.resolve({ data: [] }),
    surveyIds.length
      ? supabase
          .from("survey_responses")
          .select("id, survey_id, respondent_id, submitted_at")
          .in("survey_id", surveyIds)
          .limit(300)
      : Promise.resolve({ data: [] }),
  ]);

  const leaveRequests = (leaveRequestsData ?? []) as LeaveRequestRow[];
  const jobApplications = (jobApplicationsData ?? []) as JobApplicationRow[];
  const performanceReviews = (performanceReviewsData ?? []) as PerformanceReviewRow[];
  const surveyResponses = (surveyResponsesData ?? []) as SurveyResponseRow[];

  const employeeMap = Object.fromEntries(employees.map((employee) => [employee.id, employee]));
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const onLeaveEmployees = employees.filter((employee) => employee.status === "on_leave");
  const inactiveEmployees = employees.filter((employee) => employee.status !== "active" && employee.status !== "on_leave");
  const pendingLeave = leaveRequests.filter((request) => request.status === "pending");
  const approvedLeave = leaveRequests.filter((request) => request.status === "approved");
  const openJobs = jobs.filter((job) => job.status === "open");
  const newHires = employees.filter((employee) => employee.start_date && new Date(employee.start_date) >= thirtyDaysAgo);
  const draftPayroll = payrollRuns.find((run) => run.status === "draft" || run.status === "processing");
  const latestPayroll = payrollRuns[0];
  const totalPayroll = payrollRuns.reduce((sum, run) => sum + toNumber(run.total_net), 0);
  const payrollCurrency = latestPayroll?.currency ?? "GBP";
  const activeCycle = performanceCycles.find((cycle) => cycle.status === "active");
  const activeSurvey = surveys.find((survey) => survey.status === "active");
  const completedReviews = performanceReviews.filter((review) =>
    ["submitted", "acknowledged"].includes(review.status)
  ).length;
  const avgRating =
    performanceReviews.filter((review) => review.rating != null).reduce((sum, review) => sum + Number(review.rating), 0) /
    Math.max(performanceReviews.filter((review) => review.rating != null).length, 1);

  const todayKey = today.toISOString().slice(0, 10);
  const todayTimeEntries = timeEntries.filter((entry) => entry.date === todayKey);
  const todayAttendanceCount = new Set(todayTimeEntries.map((entry) => entry.employee_id)).size;
  const attendanceRate = pct(todayAttendanceCount, activeEmployees.length);
  const approvedHours = timeEntries
    .filter((entry) => entry.status === "approved" || entry.status === "submitted")
    .reduce((sum, entry) => sum + toNumber(entry.hours), 0);
  const overtimeHours = timeEntries
    .filter((entry) => entry.category === "overtime")
    .reduce((sum, entry) => sum + toNumber(entry.hours), 0);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    return {
      key: monthKey(date),
      label: monthFormatter.format(date),
    };
  });

  const monthlyHires = months.map((month) =>
    employees.filter((employee) => employee.start_date && monthKey(new Date(employee.start_date)) === month.key).length
  );
  const monthlyLeaveDays = months.map((month) =>
    approvedLeave
      .filter((request) => monthKey(new Date(request.start_date)) === month.key)
      .reduce((sum, request) => sum + daysBetween(request.start_date, request.end_date), 0)
  );
  const monthlyPayroll = months.map((month) =>
    payrollRuns
      .filter((run) => run.pay_period_end && monthKey(new Date(run.pay_period_end)) === month.key)
      .reduce((sum, run) => sum + toNumber(run.total_net), 0)
  );

  const monthlyApplications = months.map((month) =>
    jobApplications.filter((app) => monthKey(new Date(app.applied_at)) === month.key).length
  );

  const deptEntries = Object.entries(
    activeEmployees.reduce<Record<string, number>>((acc, employee) => {
      const department = employee.department ?? "Unassigned";
      acc[department] = (acc[department] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxDept = Math.max(...deptEntries.map(([, count]) => count), 1);

  const pipelineStages = ["applied", "screening", "interview", "offer", "hired", "rejected"].map((stage) => ({
    stage,
    count: jobApplications.filter((application) => application.stage === stage).length,
  }));
  const pipelineTotal = Math.max(jobApplications.length, 1);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => {
    const dayEntries = timeEntries.filter((entry) => {
      const date = new Date(`${entry.date}T00:00:00`);
      const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return day === index;
    });
    return {
      label,
      regular: dayEntries.filter((entry) => entry.category === "regular").reduce((sum, entry) => sum + toNumber(entry.hours), 0),
      overtime: dayEntries.filter((entry) => entry.category === "overtime").reduce((sum, entry) => sum + toNumber(entry.hours), 0),
      absent: dayEntries.filter((entry) => entry.category === "sick").reduce((sum, entry) => sum + toNumber(entry.hours), 0),
    };
  });

  const heatmapDays = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const day = index + 1;
    const current = new Date(today.getFullYear(), today.getMonth(), day);
    const count = approvedLeave.filter((request) => {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      return start <= current && end >= current;
    }).length;
    return {
      day,
      count,
      isToday: day === today.getDate(),
    };
  });

  const upcomingLeave = approvedLeave
    .filter((request) => new Date(request.end_date) >= today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 4);
  const recentApplications = jobApplications.slice(0, 4);
  const recentHires = newHires.slice(0, 4);
  const riskSignals = [
    pendingLeave.length > 0
      ? `${pendingLeave.length} leave request${pendingLeave.length === 1 ? "" : "s"} need review`
      : "Leave approvals are clear",
    openJobs.length > 0
      ? `${openJobs.length} open role${openJobs.length === 1 ? "" : "s"} in recruitment`
      : "No open requisitions",
    draftPayroll ? `${draftPayroll.name} is still ${draftPayroll.status}` : "Payroll is not waiting on a draft",
    activeSurvey ? `${activeSurvey.title} is collecting responses` : "No active pulse survey",
  ];

  if (!org) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-8">
        <section className="rounded-[24px] border border-blue-100 bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <AtlasAiMark className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy-950">
            Build your HR command center
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-500">
            Create or join an organisation to unlock workforce analytics, leave heatmaps, payroll trends,
            recruitment pipeline reporting, and operating alerts.
          </p>
          <Link
            href="/settings/org"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Set up organisation
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-5 lg:p-7">
      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
          <div className="grid gap-6 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f0fdf4_100%)] p-6 lg:grid-cols-[1fr_280px] lg:p-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-xs">
                  {fullDateFormatter.format(today)}
                </span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {attendanceRate}% attendance signal
                </span>
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-navy-950 lg:text-4xl">
                {greeting(user?.full_name ?? "there")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-500">
                {buildSnapshot({
                  pendingLeaveCount: pendingLeave.length,
                  onLeaveCount: onLeaveEmployees.length,
                  newHiresCount: newHires.length,
                  openJobsCount: openJobs.length,
                  candidatesCount: jobApplications.length,
                  draftPayrollName: draftPayroll?.name ?? null,
                  attendanceRate,
                  activeEmployeeCount: activeEmployees.length,
                })}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {isAdmin ? (
                  <Link
                    href="/org/people/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    <Icon className="h-4 w-4" path="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    Add employee
                  </Link>
                ) : null}
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-sm transition-colors hover:bg-navy-50"
                >
                  <Icon className="h-4 w-4" path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  Run report
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-navy-400">Operating pulse</p>
              <div className="mt-4 space-y-2.5">
                {riskSignals.map((signal, index) => {
                  const isUrgent = index === 0 && pendingLeave.length > 0;
                  return (
                    <div key={signal} className={cn(
                      "flex items-center gap-3 rounded-xl border p-3",
                      isUrgent
                        ? "border-amber-100 bg-amber-50/80"
                        : "border-transparent bg-white shadow-xs"
                    )}>
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
                        isUrgent ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        {isUrgent
                          ? <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" /></svg>
                          : <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        }
                      </span>
                      <p className={cn("text-xs leading-5 font-medium", isUrgent ? "text-amber-800" : "text-navy-600")}>{signal}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-navy-200 bg-navy-950 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-200">AI briefing</p>
              <h2 className="mt-1 text-xl font-semibold">Today&apos;s priorities</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <AtlasAiMark className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { value: pendingLeave.length, label: "approval queue", strip: "from-amber-400 to-orange-500", urgent: pendingLeave.length > 0 },
              { value: openJobs.length, label: "open roles", strip: "from-blue-400 to-cyan-500", urgent: false },
              { value: Math.round(avgRating * 10) / 10 || 0, label: "avg review score", strip: "from-violet-400 to-purple-500", urgent: false },
              { value: surveyResponses.length, label: "survey responses", strip: "from-emerald-400 to-teal-500", urgent: false },
            ].map((tile) => (
              <div key={tile.label} className="relative overflow-hidden rounded-2xl bg-white/10 p-4 transition-colors hover:bg-white/15">
                <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${tile.strip}`} />
                <p className={cn("font-mono text-2xl font-semibold", tile.urgent ? "text-amber-300" : "text-white")}>
                  {tile.value}
                </p>
                <p className="mt-1 text-[11px] font-medium text-blue-200">{tile.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/copilot"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-blue-50"
          >
            Ask Atlas AI
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          href="/org/people"
          title="Total workforce"
          value={formatNumber(employees.length)}
          helper={`${activeEmployees.length} active · ${onLeaveEmployees.length} away`}
          trend={newHires.length > 0 ? `+${newHires.length} hires` : undefined}
          iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          tone="blue"
          sparkPoints={monthlyHires}
        />
        <MetricCard
          href="/time"
          title="Attendance coverage"
          value={`${attendanceRate}%`}
          helper={`${todayAttendanceCount} checked in today`}
          iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          tone="emerald"
          sparkPoints={[attendanceRate, attendanceRate, attendanceRate, attendanceRate, attendanceRate, attendanceRate]}
        />
        <MetricCard
          href="/org/leave"
          title="Leave approvals"
          value={formatNumber(pendingLeave.length)}
          helper={`${approvedLeave.length} approved requests in view`}
          iconPath="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          tone={pendingLeave.length > 0 ? "amber" : "emerald"}
          sparkPoints={monthlyLeaveDays}
        />
        <MetricCard
          href="/recruiting"
          title="Hiring pipeline"
          value={formatNumber(jobApplications.length)}
          helper={`${openJobs.length} open jobs · ${recentApplications.length} fresh candidates`}
          iconPath="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          tone="violet"
          sparkPoints={monthlyApplications}
        />
        <MetricCard
          href="/payroll"
          title="Payroll exposure"
          value={formatMoney(totalPayroll, payrollCurrency)}
          helper={latestPayroll ? `${latestPayroll.name} latest run` : "No payroll runs yet"}
          iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          tone="rose"
          sparkPoints={monthlyPayroll}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Workforce momentum</h2>
              <p className="mt-1 text-sm text-navy-500">Hires, leave load, and payroll volume over the last 6 months.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Hires</span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Leave days</span>
              <span className="rounded-full bg-navy-100 px-3 py-1.5 text-navy-600">Payroll bars</span>
            </div>
          </div>
          <MomentumChart
            months={months.map((month) => month.label)}
            hires={monthlyHires}
            leaveDays={monthlyLeaveDays}
            payroll={monthlyPayroll}
          />
        </div>

        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Workforce structure</h2>
              <p className="mt-1 text-sm text-navy-500">Status mix and department concentration.</p>
            </div>
            <Link href="/org/people" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Directory
            </Link>
          </div>
          <div className="mt-5">
            <DonutChart
              center={formatNumber(employees.length)}
              label="employees"
              segments={[
                { label: "Active", value: activeEmployees.length, color: "#2563eb" },
                { label: "On leave", value: onLeaveEmployees.length, color: "#f59e0b" },
                { label: "Other", value: inactiveEmployees.length, color: "#94a3b8" },
              ]}
            />
          </div>
          <div className="mt-6 space-y-3">
            {deptEntries.length > 0 ? (
              deptEntries.map(([department, count], index) => (
                <div key={department} className="grid grid-cols-[120px_1fr_34px] items-center gap-3">
                  <span className="truncate text-xs font-semibold text-navy-600">{department}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"][index % 6]
                      )}
                      style={{ width: `${pct(count, maxDept)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-navy-700">{count}</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-navy-50 p-4 text-sm text-navy-500">Add employees to see department analytics.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Attendance summary</h2>
              <p className="mt-1 text-sm text-navy-500">{formatNumber(Math.round(approvedHours))} tracked hours, {formatNumber(Math.round(overtimeHours))} overtime.</p>
            </div>
            <Link href="/time" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Time
            </Link>
          </div>
          <AttendanceBars days={weekDays} />
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-navy-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Regular</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Overtime</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /> Sick</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Leave heatmap</h2>
              <p className="mt-1 text-sm text-navy-500">{monthFormatter.format(monthStart)} approved leave coverage.</p>
            </div>
            <Link href="/org/leave" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage
            </Link>
          </div>
          <div className="mt-5">
            <LeaveHeatmap days={heatmapDays} />
          </div>
        </div>

        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Recruitment funnel</h2>
              <p className="mt-1 text-sm text-navy-500">Candidates across active requisitions.</p>
            </div>
            <Link href="/recruiting" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              ATS
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {pipelineStages.map(({ stage, count }, index) => (
              <PipelineStage
                key={stage}
                label={stage}
                count={count}
                total={pipelineTotal}
                color={["bg-blue-500", "bg-cyan-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500"][index]}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="overflow-hidden rounded-[24px] border border-navy-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">Work assignment board</h2>
              <p className="mt-1 text-sm text-navy-500">Recent people movement, reviews, and onboarding signals.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/performance" className="rounded-xl border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50">
                Performance
              </Link>
              <Link href="/onboarding" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                Onboarding
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-navy-50 text-xs font-semibold uppercase tracking-[0.06em] text-navy-400">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Start date</th>
                  <th className="px-5 py-3">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {(recentHires.length > 0 ? recentHires : employees.slice(0, 6)).map((employee) => {
                  const isNew = employee.start_date && new Date(employee.start_date) >= thirtyDaysAgo;
                  const employeeReviews = performanceReviews.filter((review) => review.employee_id === employee.id);
                  const latestReview = employeeReviews[0];
                  return (
                    <tr key={employee.id} className="text-sm">
                      <td className="px-5 py-4">
                        <Link href={`/org/people/${employee.id}`} className="flex items-center gap-3">
                          <Avatar name={employee.full_name} src={employee.photo_url} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy-900">{employee.full_name}</p>
                            <p className="truncate text-xs text-navy-400">{employee.job_title ?? "Employee"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-navy-500">{employee.department ?? "Unassigned"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                            employee.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : employee.status === "on_leave"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-navy-100 text-navy-600"
                          )}
                        >
                          {employee.status?.replace(/_/g, " ") ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-navy-500">
                        {employee.start_date ? shortDateFormatter.format(new Date(employee.start_date)) : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-navy-600">
                          {isNew
                            ? "New hire"
                            : latestReview?.rating
                              ? `${latestReview.rating}/5 review`
                              : "No recent action"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-950">Priority queue</h2>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {pendingLeave.length + (draftPayroll ? 1 : 0)} open
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {pendingLeave.slice(0, 3).map((request) => {
                const employee = employeeMap[request.employee_id];
                return (
                  <Link key={request.id} href="/org/leave" className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 hover:bg-amber-50">
                    <Avatar name={employee?.full_name} src={employee?.photo_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{employee?.full_name ?? "Unknown employee"}</p>
                      <p className="truncate text-xs capitalize text-navy-500">
                        {request.leave_type.replace(/_/g, " ")} - {daysBetween(request.start_date, request.end_date)} days
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-amber-700">Review</span>
                  </Link>
                );
              })}
              {draftPayroll ? (
                <Link href={`/payroll/${draftPayroll.id}`} className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-3 hover:bg-rose-50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{draftPayroll.name}</p>
                    <p className="text-xs capitalize text-navy-500">{draftPayroll.status} payroll run</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700">Open</span>
                </Link>
              ) : null}
              {pendingLeave.length === 0 && !draftPayroll ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  No urgent approvals waiting right now.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-950">Upcoming leave</h2>
              <Link href="/org/leave" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Calendar
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingLeave.length > 0 ? (
                upcomingLeave.map((request) => {
                  const employee = employeeMap[request.employee_id];
                  return (
                    <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3">
                      <Avatar name={employee?.full_name} src={employee?.photo_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900">{employee?.full_name ?? "Unknown employee"}</p>
                        <p className="text-xs capitalize text-navy-500">{request.leave_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="text-right font-mono text-[11px] text-navy-400">
                        <p>{shortDateFormatter.format(new Date(request.start_date))}</p>
                        <p>{shortDateFormatter.format(new Date(request.end_date))}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl bg-navy-50 p-4 text-sm text-navy-500">No upcoming approved leave.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {/* Engagement */}
        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-950">Engagement</h2>
            <Link href="/surveys" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Surveys</Link>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-900 leading-snug">
                  {activeSurvey?.title ?? "No active survey"}
                </p>
                <p className="mt-1 text-xs text-navy-500">
                  {activeSurvey
                    ? `${surveyResponses.length} response${surveyResponses.length === 1 ? "" : "s"} captured`
                    : "Launch a pulse check from Surveys"}
                </p>
                {activeSurvey && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Active
                  </span>
                )}
              </div>
              <div className="h-16 w-28 shrink-0">
                <MiniSparkline
                  points={surveyResponses.length > 0 ? [1, 2, surveyResponses.length, surveyResponses.length + 1] : [0, 0, 0, 0]}
                  color="#2563eb"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-3 text-center">
              <p className="font-mono text-xl font-bold text-navy-950">{surveyResponses.length}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">Responses</p>
            </div>
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-3 text-center">
              <p className="font-mono text-xl font-bold text-navy-950">{surveys.filter((s) => s.status === "active").length}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">Active surveys</p>
            </div>
          </div>
        </div>

        {/* Performance cycle */}
        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-950">Performance cycle</h2>
            <Link href="/performance" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Reviews</Link>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-4">
            <div className="flex items-center gap-5">
              <RingProgress
                value={completedReviews}
                max={Math.max(performanceReviews.length, 1)}
                color="#8b5cf6"
                size={80}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy-900 leading-snug">{activeCycle?.name ?? "No active cycle"}</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold text-violet-700">{completedReviews}</p>
                <p className="text-xs text-navy-500">of {performanceReviews.length} reviews submitted</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-3 text-center">
              <p className="font-mono text-xl font-bold text-navy-950">{performanceCycles.filter((c) => c.status === "active").length}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">Active cycles</p>
            </div>
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-3 text-center">
              <p className="font-mono text-xl font-bold text-navy-950">{avgRating > 0 ? (Math.round(avgRating * 10) / 10).toFixed(1) : "–"}</p>
              <p className="text-[11px] text-navy-400 mt-0.5">Avg rating</p>
            </div>
          </div>
        </div>

        {/* AI Documents */}
        <div className="rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-950">AI documents</h2>
            <Link href="/dashboard/documents" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Library</Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {docs.length > 0 ? (
              docs.slice(0, 3).map((doc) => (
                <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-navy-100 p-3 transition-colors hover:border-blue-100 hover:bg-blue-50/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-sm">
                    <AtlasAiMark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{doc.title}</p>
                    <p className="truncate text-xs capitalize text-navy-400">{doc.tool_slug?.replace(/-/g, " ") ?? "Generated document"}</p>
                  </div>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-navy-300" path="M9 5l7 7-7 7" />
                </Link>
              ))
            ) : (
              <Link href="/copilot"
                className="flex items-center gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-sm font-semibold text-navy-700 transition-colors hover:bg-blue-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                  <AtlasAiMark className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-navy-800">Generate your first document</p>
                  <p className="mt-0.5 text-xs font-normal text-navy-500">Job descriptions, offer letters, PIPs &amp; more</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
