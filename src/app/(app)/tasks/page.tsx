import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { dataOrEmpty } from "@/lib/supabase/schema";
import { TasksClient } from "./tasks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks & Reminders | Atlas HR" };

export default async function TasksPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [tasks, employees] = await Promise.all([
    dataOrEmpty(
      supabase
        .from("employee_tasks")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("created_at", { ascending: false })
        .limit(200)
    ),
    dataOrEmpty(
      supabase
        .from("employees")
        .select("id, full_name, department")
        .eq("org_id", orgCtx.org.id)
        .eq("status", "active")
        .order("full_name")
    ),
  ]);

  const allEmployees = (employees ?? []) as Array<{ id: string; full_name: string; department: string | null }>;
  const empMap = Object.fromEntries(allEmployees.map((e) => [e.id, e.full_name]));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tasks & Reminders</h1>
            <p className="text-blue-300 text-sm mt-0.5">Track HR follow-ups — or let Atlas AI pull them from your notes</p>
          </div>
        </div>
      </div>

      <TasksClient
        tasks={tasks ?? []}
        employees={allEmployees}
        empMap={empMap}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
