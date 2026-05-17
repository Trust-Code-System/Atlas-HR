import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NewCycleForm } from "./new-cycle-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Review Cycle" };

export default async function NewPerformanceCyclePage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/performance");

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/performance" className="hover:text-white transition-colors">Performance</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300">New review cycle</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">New review cycle</h1>
          <p className="text-blue-300 text-sm mt-1">A pending review will be auto-created for every active employee.</p>
        </div>
      </div>
      <NewCycleForm />
    </div>
  );
}
