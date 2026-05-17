import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { dataOrEmpty } from "@/lib/supabase/schema";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { AssetAssignment, CompanyAsset, Employee } from "@/types/database";
import { AssetsClient } from "./assets-client";

export const metadata: Metadata = { title: "Assets | Atlas HR" };

export default async function AssetsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawAssets, rawAssignments, rawEmployees] = await Promise.all([
    dataOrEmpty(
      supabase
        .from("company_assets")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("status")
        .order("asset_type")
        .order("name"),
    ),
    dataOrEmpty(
      supabase
        .from("asset_assignments")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("created_at", { ascending: false }),
    ),
    dataOrEmpty(
      supabase
        .from("employees")
        .select("id, full_name, job_title, department, status")
        .eq("org_id", orgCtx.org.id)
        .neq("status", "terminated")
        .order("full_name"),
    ),
  ]);

  const assets = (rawAssets ?? []) as CompanyAsset[];
  const assignments = (rawAssignments ?? []) as AssetAssignment[];
  const employees = (rawEmployees ?? []) as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];
  const activeAssignments = assignments.filter((assignment) => assignment.assignment_status === "assigned");
  const repairCount = assets.filter((asset) => asset.status === "repair" || asset.condition === "repair_needed").length;
  const inventoryValue = assets.reduce((sum, asset) => sum + (asset.purchase_cost ?? 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Assets</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                Track laptops, phones, access cards, licenses, and equipment assigned to staff.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[420px] lg:min-w-[470px]">
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Inventory</p>
              <p className="font-mono text-2xl font-bold text-white">{assets.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Assigned</p>
              <p className="font-mono text-2xl font-bold text-white">{activeAssignments.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Value</p>
              <p className="font-mono text-2xl font-bold text-white">
                {inventoryValue > 0 ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(inventoryValue) : repairCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AssetsClient
        assets={assets}
        assignments={assignments}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
