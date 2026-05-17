import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documents" };

interface Props {
  searchParams: Promise<{ q?: string; tool?: string; page?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const { q, tool, page } = await searchParams;
  const currentPage = Number(page ?? 1);
  const pageSize = 20;
  const user = await getUser();
  const supabase = await createClient();

  let query = supabase
    .from("generated_documents")
    .select("id, title, tool_slug, created_at", { count: "exact" })
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  if (q) query = query.ilike("title", `%${q}%`);
  if (tool) query = query.eq("tool_slug", tool);

  const { data: docs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Generated Documents</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {count ?? 0} document{(count ?? 0) !== 1 ? "s" : ""} · AI-powered HR drafts
              </p>
            </div>
          </div>
          <Link
            href="/copilot"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New document
          </Link>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search documents…"
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </form>

      {/* Documents list */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {docs && docs.length > 0 ? (
          <div className="divide-y divide-navy-100">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/dashboard/documents/${doc.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-navy-50/40 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-800 truncate group-hover:text-blue-700 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Badge variant="default">
                    {doc.tool_slug?.replace(/-/g, " ")}
                  </Badge>
                  <svg className="h-4 w-4 text-navy-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">
              {q ? "No documents match your search" : "No documents yet"}
            </h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">
              {q ? "Try a different search term." : "Generate your first HR document with AI."}
            </p>
            {!q && (
              <Link href="/copilot" className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Generate a document
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-navy-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}${q ? `&q=${q}` : ""}`}
                className="px-3 py-1.5 text-sm border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}${q ? `&q=${q}` : ""}`}
                className="px-3 py-1.5 text-sm border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
