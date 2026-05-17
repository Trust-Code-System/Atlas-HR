import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ReferralsClient } from "./referrals-client";
import type { JobReferral, Job, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Referrals | Atlas HR" };

export default async function ReferralsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawReferrals, rawJobs, rawEmployees] = await Promise.all([
    dataOrEmpty(supabase
      .from("job_referrals")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: false })),
    dataOrEmpty(supabase
      .from("jobs")
      .select("id, title, department, location, status")
      .eq("org_id", orgCtx.org.id)
      .eq("status", "open")
      .order("title")),
    dataOrEmpty(supabase
      .from("employees")
      .select("id, full_name, job_title, department, status")
      .eq("org_id", orgCtx.org.id)
      .eq("status", "active")
      .order("full_name")),
  ]);

  const referrals = (rawReferrals ?? []) as JobReferral[];
  const jobs      = (rawJobs      ?? []) as Pick<Job, "id" | "title" | "department" | "location" | "status">[];
  const employees = (rawEmployees ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const hiredCount   = referrals.filter((r) => r.status === "hired").length;
  const pendingCount = referrals.filter((r) => r.status === "pending" || r.status === "reviewing").length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Referrals</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name} · {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {referrals.length > 0 && (
            <div className="flex gap-5 shrink-0">
              {pendingCount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Pending</p>
                  <p className="font-mono text-2xl font-bold text-amber-300 tabular-nums">{pendingCount}</p>
                </div>
              )}
              {hiredCount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Hired</p>
                  <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{hiredCount}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ReferralsClient
        referrals={referrals}
        jobs={jobs}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
