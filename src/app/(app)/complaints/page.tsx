import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { dataOrEmpty } from "@/lib/supabase/schema";
import { ComplaintsClient } from "./complaints-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Complaints & Cases | Atlas HR" };

export default async function ComplaintsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const isOwner = orgCtx.roles.includes("workspace_owner");

  // RLS scopes what each viewer can see (own reports / assigned / HR / owner).
  const complaints = await dataOrEmpty(
    supabase
      .from("complaints")
      .select("*")
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: false })
      .limit(200)
  );

  // Employee roster (admins only — RLS restricts the employees table to admins).
  const employees = orgCtx.isAdmin
    ? await dataOrEmpty(
        supabase
          .from("employees")
          .select("id, full_name, department")
          .eq("org_id", orgCtx.org.id)
          .eq("status", "active")
          .order("full_name")
      )
    : [];
  const allEmployees = (employees ?? []) as Array<{ id: string; full_name: string; department: string | null }>;
  const empMap = Object.fromEntries(allEmployees.map((e) => [e.id, e.full_name]));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(244,63,94,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Complaints & Cases</h1>
            <p className="text-blue-300 text-sm mt-0.5">Raise a concern confidentially — or manage open cases</p>
          </div>
        </div>
      </div>

      <ComplaintsClient
        complaints={complaints ?? []}
        employees={allEmployees}
        empMap={empMap}
        isAdmin={orgCtx.isAdmin}
        isOwner={isOwner}
        currentUserId={user.id}
      />
    </div>
  );
}
