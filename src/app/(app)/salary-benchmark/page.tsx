import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { BenchmarkClient } from "./benchmark-client";

export const metadata = { title: "Salary Benchmark | Atlas HR" };

export default async function SalaryBenchmarkPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: rawSaved } = await supabase
    .from("generated_documents")
    .select("id, title, inputs, output, created_at")
    .eq("user_id", user.id)
    .eq("tool_slug", "salary-benchmark")
    .order("created_at", { ascending: false })
    .limit(50);

  const saved = (rawSaved ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    inputs: (d.inputs ?? {}) as Record<string, unknown>,
    output: d.output,
    created_at: d.created_at,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Salary Benchmark</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              Analyse market data and save snapshots to compare over time
              {saved.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-blue-400/30">
                  {saved.length} saved
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <BenchmarkClient savedBenchmarks={saved} />
    </div>
  );
}
