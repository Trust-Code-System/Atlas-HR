import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NewRunForm } from "./new-run-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Start Onboarding Run" };

export default async function NewOnboardingRunPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/onboarding");

  const supabase = await createClient();

  const [{ data: employees }, { data: templates }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("org_id", orgCtx.org.id)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
    supabase
      .from("lifecycle_templates")
      .select("id, name, type")
      .eq("org_id", orgCtx.org.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/onboarding" className="hover:text-white transition-colors">Onboarding</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300">Start run</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Start onboarding run</h1>
          <p className="text-blue-300 text-sm mt-1">Assign a template to an employee to begin their onboarding checklist.</p>
        </div>
      </div>
      <NewRunForm employees={(employees ?? []) as Array<{ id: string; full_name: string }>} templates={templates ?? []} />
    </div>
  );
}
