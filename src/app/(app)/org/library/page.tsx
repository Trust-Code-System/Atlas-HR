import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LibraryClient } from "./library-client";
import type { Metadata } from "next";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Policy Library" };

const CATEGORIES = [
  "general", "leave", "conduct", "safety", "compensation", "benefits",
  "performance", "it", "diversity", "legal",
];

const categoryLabels: Record<string, string> = {
  general: "General",
  leave: "Leave & Absence",
  conduct: "Code of Conduct",
  safety: "Health & Safety",
  compensation: "Compensation",
  benefits: "Benefits",
  performance: "Performance",
  it: "IT & Security",
  diversity: "Diversity & Inclusion",
  legal: "Legal & Compliance",
};

export default async function OrgLibraryPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const items = orgCtx.isAdmin
    ? await dataOrEmpty(supabase
        .from("policy_library")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .order("category", { ascending: true }))
    : await dataOrEmpty(supabase
        .from("policy_library")
        .select("*")
        .eq("org_id", orgCtx.org.id)
        .eq("is_published", true)
        .order("category", { ascending: true }));

  const allItems = items ?? [];

  // Index status for the "AI-indexed" badge + per-document AI toggle (§28).
  const kbDocs = orgCtx.isAdmin
    ? await dataOrEmpty(supabase
        .from("kb_documents")
        .select("source_id, status, chunk_count, ai_enabled")
        .eq("org_id", orgCtx.org.id)
        .eq("source", "policy_library"))
    : [];
  const kbMap = Object.fromEntries(
    (kbDocs ?? [])
      .filter((d): d is typeof d & { source_id: string } => Boolean(d.source_id))
      .map((d) => [d.source_id, { status: d.status, chunkCount: d.chunk_count, aiEnabled: d.ai_enabled }])
  );

  const grouped = CATEGORIES.reduce<Record<string, typeof allItems>>((acc, cat) => {
    const catItems = allItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const publishedCount = allItems.filter((i) => i.is_published).length;
  const categories     = Object.keys(grouped).length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Policy Library</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {orgCtx.org.name} · {publishedCount} published {publishedCount !== 1 ? "policies" : "policy"}
                {categories > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-blue-400/30">
                    {categories} {categories !== 1 ? "categories" : "category"}
                  </span>
                )}
              </p>
            </div>
          </div>
          {orgCtx.isAdmin && (
            <Link
              href="/org/library/new"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add policy
            </Link>
          )}
        </div>
      </div>

      {allItems.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-navy-500 mb-3">
                {categoryLabels[cat] ?? cat}
              </h2>
              <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-navy-100">
                  {catItems.map((item) => (
                    <LibraryClient key={item.id} item={item} isAdmin={orgCtx.isAdmin} kb={kbMap[item.id] ?? null} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-navy-200 text-center py-20 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">No policies yet</h3>
          <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">Publish your HR policies for all employees to access.</p>
          {orgCtx.isAdmin && (
            <Link href="/org/library/new" className="inline-flex items-center gap-1.5 text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add policy
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
