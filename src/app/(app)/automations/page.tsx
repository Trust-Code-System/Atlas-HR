import { getCurrentOrg } from "@/lib/org/get-current-org";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { dataOrEmpty } from "@/lib/supabase/schema";
import { AutomationsClient } from "./automations-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Workflows | Atlas HR" };

export default async function AutomationsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/dashboard");

  const supabase = await createClient();
  const workflows = await dataOrEmpty(
    supabase
      .from("automation_workflows")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: false })
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Workflows</h1>
            <p className="text-blue-300 text-sm mt-0.5">Describe a rule in plain English — Atlas builds the automation</p>
          </div>
        </div>
      </div>

      <AutomationsClient workflows={workflows ?? []} />
    </div>
  );
}
