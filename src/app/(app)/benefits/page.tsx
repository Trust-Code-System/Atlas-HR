import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BenefitsClient } from "./benefits-client";
import type { BenefitPlan, BenefitEnrolment, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Benefits | Atlas HR" };

export default async function BenefitsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawPlans, rawEnrolments, rawEmployees] = await Promise.all([
    dataOrEmpty(supabase
      .from("benefit_plans")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .neq("status", "archived")
      .order("type")
      .order("name")),
    dataOrEmpty(supabase
      .from("benefit_enrolments")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: false })),
    dataOrEmpty(supabase
      .from("employees")
      .select("id, full_name, job_title, department, status")
      .eq("org_id", orgCtx.org.id)
      .eq("status", "active")
      .order("full_name")),
  ]);

  const plans      = (rawPlans      ?? []) as BenefitPlan[];
  const enrolments = (rawEnrolments ?? []) as BenefitEnrolment[];
  const employees  = (rawEmployees  ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const activeCount   = plans.filter((p) => p.status === "active").length;
  const enrolledCount = enrolments.length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Benefits</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name}
                {activeCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-400/30">
                    {activeCount} active plan{activeCount !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>
          {enrolledCount > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Enrolments</p>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">{enrolledCount}</p>
            </div>
          )}
        </div>
      </div>

      <BenefitsClient
        plans={plans}
        enrolments={enrolments}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
