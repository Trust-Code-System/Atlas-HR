import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { TravelClient } from "./travel-client";
import type { TravelRequest, Employee } from "@/types/database";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Travel | Atlas HR" };

export default async function TravelPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawRequests, rawEmployees] = await Promise.all([
    dataOrEmpty(
      supabase
        .from("travel_requests")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("created_at", { ascending: false })
    ),
    dataOrEmpty(
      supabase
        .from("employees")
        .select("id, full_name, job_title, department, status")
        .eq("org_id", orgCtx.org.id)
        .eq("status", "active")
        .order("full_name")
    ),
  ]);

  const requests  = rawRequests as TravelRequest[];
  const employees = rawEmployees as Pick<Employee, "id" | "full_name" | "job_title" | "department" | "status">[];

  const pending   = requests.filter((r) => r.status === "pending").length;
  const approved  = requests.filter((r) => r.status === "approved").length;
  const completed = requests.filter((r) => r.status === "completed").length;

  // Active travelers — approved trips where departure <= today <= return
  const today = new Date().toISOString().split("T")[0];
  const active = requests.filter(
    (r) => r.status === "approved" && r.departure_date <= today && r.return_date >= today
  ).length;

  const kpis = [
    {
      label: "Total requests",
      value: requests.length.toString(),
      strip: "from-blue-400 to-blue-600",
      grad: "from-blue-500 to-blue-700",
      icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
    },
    {
      label: "Pending approval",
      value: pending.toString(),
      strip: "from-amber-400 to-orange-500",
      grad: "from-amber-500 to-orange-600",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Currently travelling",
      value: active.toString(),
      strip: "from-emerald-400 to-teal-500",
      grad: "from-emerald-500 to-teal-600",
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    },
    {
      label: "Completed trips",
      value: completed.toString(),
      strip: "from-violet-400 to-purple-500",
      grad: "from-violet-500 to-purple-600",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Travel</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {orgCtx.org.name}
              {pending > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                  {pending} pending approval
                </span>
              )}
              {active > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-400/30">
                  {active} currently travelling
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      <TravelClient
        requests={requests}
        employees={employees}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
