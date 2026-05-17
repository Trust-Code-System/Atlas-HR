import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NewEmployeeForm } from "./new-employee-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Employee" };

export default async function NewEmployeePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");
  if (!orgData.isAdmin) redirect("/org/people");

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, job_title, department")
    .eq("org_id", orgData.org.id)
    .neq("status", "terminated")
    .order("full_name");

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/org/people" className="hover:text-white transition-colors">People</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300">Add employee</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Add employee</h1>
          <p className="text-blue-300 text-sm mt-1">Add a new member to your {orgData.org.name} people directory.</p>
        </div>
      </div>
      <NewEmployeeForm managers={(employees ?? []) as { id: string; full_name: string; job_title: string | null; department: string | null }[]} />
    </div>
  );
}
