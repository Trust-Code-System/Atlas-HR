import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ExpensesClient } from "./expenses-client";
import type { Expense, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Expenses | Atlas HR" };

export default async function ExpensesPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawExpenses, rawEmployees] = await Promise.all([
    dataOrEmpty(
      supabase
        .from("expenses")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("created_at", { ascending: false })
    ),
    dataOrEmpty(
      supabase
        .from("employees")
        .select("id, full_name, job_title, department, status")
        .eq("org_id", orgCtx.org.id)
        .eq("status", "active")
        .order("full_name")
    ),
  ]);

  const expenses  = rawExpenses as Expense[];
  const employees = rawEmployees as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const pending    = expenses.filter((e) => e.status === "pending").length;
  const approved   = expenses.filter((e) => e.status === "approved").length;
  const reimbursed = expenses.filter((e) => e.status === "reimbursed").length;
  const totalPending = expenses
    .filter((e) => e.status === "pending" || e.status === "approved")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const kpis = [
    {
      label: "Total claims",
      value: expenses.length.toString(),
      strip: "from-blue-400 to-blue-600",
      grad: "from-blue-500 to-blue-700",
      icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z",
    },
    {
      label: "Pending review",
      value: pending.toString(),
      strip: "from-amber-400 to-orange-500",
      grad: "from-amber-500 to-orange-600",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Approved",
      value: approved.toString(),
      strip: "from-emerald-400 to-teal-500",
      grad: "from-emerald-500 to-teal-600",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Outstanding (USD)",
      value: `$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      strip: "from-violet-400 to-purple-500",
      grad: "from-violet-500 to-purple-600",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Expenses</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {orgCtx.org.name}
              {pending > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                  {pending} awaiting review
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className="font-mono text-2xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      <ExpensesClient
        expenses={expenses}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
        reimbursedCount={reimbursed}
      />
    </div>
  );
}
