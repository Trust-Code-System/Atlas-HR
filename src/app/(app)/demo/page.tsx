import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { DemoSeedForm } from "./demo-seed-form";

export const metadata: Metadata = { title: "Demo Data" };

const demoAreas = [
  { href: "/dashboard", label: "Dashboard", detail: "KPI cards, charts, alerts, and people activity" },
  { href: "/org/people", label: "People", detail: "Employee profiles, departments, managers, salaries, documents" },
  { href: "/org/leave", label: "Leave", detail: "Pending approvals, approved leave, calendar view" },
  { href: "/time", label: "Time", detail: "Timesheets, attendance coverage, overtime and submitted hours" },
  { href: "/payroll", label: "Payroll", detail: "Payroll runs, employee entries, processing status" },
  { href: "/recruiting", label: "Recruiting", detail: "Open jobs, applicants, stages and referrals" },
  { href: "/performance", label: "Performance", detail: "Active review cycle, ratings and review progress" },
  { href: "/surveys", label: "Surveys", detail: "Pulse survey, responses and participation" },
  { href: "/benefits", label: "Benefits", detail: "Plans, enrolments and renewal dates" },
  { href: "/learning", label: "Learning", detail: "Courses, enrolments, progress and certifications" },
  { href: "/disciplinary", label: "Disciplinary", detail: "Warnings, queries and case statuses" },
  { href: "/exit", label: "Exit", detail: "Offboarding record and checklist actions" },
  { href: "/succession", label: "Succession", detail: "Talent pool, readiness and potential ratings" },
  { href: "/integrations", label: "Integrations", detail: "Connected apps and enabled AI skills" },
  { href: "/org/documents", label: "Documents", detail: "Employee files, expiry dates and compliance status" },
  { href: "/org/library", label: "Policy Library", detail: "Published policies for the workspace" },
  { href: "/dashboard/documents", label: "AI Documents", detail: "Generated offer letter, PIP and job description" },
];

export default async function DemoPage() {
  // Demo data is admin-only — only the workspace admin who set the company up
  // can load or turn off demo records.
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl p-5 lg:p-8">
      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#f0fdf4_100%)] p-6 lg:p-8">
          <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-xs">
            Workspace demo mode
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-navy-950 lg:text-4xl">
            Load realistic HR data across the app
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-navy-500">
            This seeds the current workspace with demo employees and connected HR records so you can see the
            product as if a real team is using it. It recreates only Atlas demo records and leaves real data alone.
          </p>
          <DemoSeedForm />
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-navy-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-950">Pages populated by the demo</h2>
            <p className="mt-1 text-sm text-navy-500">After loading, use these links to inspect each workflow.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Start at dashboard
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {demoAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50"
            >
              <p className="font-semibold text-navy-900">{area.label}</p>
              <p className="mt-1 text-sm leading-5 text-navy-500">{area.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
