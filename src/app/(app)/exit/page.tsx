import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ExitClient } from "./exit-client";
import type { ExitRecord, ExitChecklistItem, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Exit Management | Atlas HR" };

export default async function ExitPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawExits, rawItems, rawEmployees] = await Promise.all([
    dataOrEmpty(supabase
      .from("exit_records")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: false })),
    dataOrEmpty(supabase
      .from("exit_checklist_items")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at")),
    dataOrEmpty(supabase
      .from("employees")
      .select("id, full_name, job_title, department, status")
      .eq("org_id", orgCtx.org.id)
      .order("full_name")),
  ]);

  const exits = (rawExits ?? []) as ExitRecord[];
  const items = (rawItems ?? []) as ExitChecklistItem[];
  const employees = (rawEmployees ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const activeCount = exits.filter((e) => e.status !== "completed").length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Exit Management</h1>
              <p className="text-blue-300 text-sm mt-0.5">{orgCtx.org.name} · Offboarding &amp; separation tracking</p>
            </div>
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 ring-1 ring-white/10 shrink-0">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">{activeCount} active offboarding{activeCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      <ExitClient
        exits={exits}
        items={items}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
