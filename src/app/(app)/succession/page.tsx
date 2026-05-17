import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SuccessionClient } from "./succession-client";
import type { SuccessionCandidate, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Succession Planning | Atlas HR" };

export default async function SuccessionPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawCandidates, rawEmployees] = await Promise.all([
    dataOrEmpty(supabase
      .from("succession_candidates")
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

  const candidates = (rawCandidates ?? []) as SuccessionCandidate[];
  const employees  = (rawEmployees  ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const readyNow  = candidates.filter((c) => c.readiness === "ready_now").length;
  const readySoon = candidates.filter((c) => c.readiness === "ready_1_year" || c.readiness === "ready_2_plus").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Succession Planning</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name} · {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {candidates.length > 0 && (
            <div className="flex gap-5 shrink-0">
              {readyNow > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ready Now</p>
                  <p className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">{readyNow}</p>
                </div>
              )}
              {readySoon > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">1–2 Years</p>
                  <p className="font-mono text-2xl font-bold text-amber-300 tabular-nums">{readySoon}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SuccessionClient candidates={candidates} employees={employees} isAdmin={orgCtx.isAdmin} />
    </div>
  );
}
