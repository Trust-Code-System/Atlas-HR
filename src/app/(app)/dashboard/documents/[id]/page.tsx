import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "./copy-button";
import type { Metadata } from "next";
import type { Json } from "@/types/database";

export const metadata: Metadata = { title: "Document" };

function formatInputs(inputs: Json): { key: string; value: string }[] {
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) return [];
  return Object.entries(inputs as Record<string, Json>)
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => ({
      key: k
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: String(v),
    }));
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  const createdAt = new Date(doc.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const inputs = formatInputs(doc.inputs);

  const downloadHref = `data:text/plain;charset=utf-8,${encodeURIComponent(doc.output)}`;
  const fileName = `${(doc.title ?? doc.tool_name).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
            <Link href="/dashboard/documents" className="hover:text-white transition-colors">Documents</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{doc.title ?? doc.tool_name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {doc.title ?? doc.tool_name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-blue-200 ring-1 ring-white/10">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {doc.tool_name}
                </span>
                <span className="text-blue-400 text-xs font-mono">{createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyButton text={doc.output} />
              <a
                href={downloadHref}
                download={fileName}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-2 rounded-xl transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Document content */}
      <div className="bg-white rounded-2xl border border-navy-200 p-6 mb-6 shadow-sm">
        <h2 className="font-bold text-navy-900 mb-4">Document</h2>
        <pre className="whitespace-pre-wrap font-sans text-sm text-navy-700 leading-relaxed bg-navy-50 rounded-xl p-5 overflow-x-auto">
          {doc.output}
        </pre>
      </div>

      {/* Inputs used */}
      {inputs.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <h2 className="font-bold text-navy-900 mb-4">Inputs used to generate this document</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inputs.map(({ key, value }) => (
              <div key={key}>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-widest block mb-1">
                  {key}
                </span>
                <p className="text-sm text-navy-700 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
