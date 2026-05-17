import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OrgDocumentsClient } from "./org-documents-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employee Documents | Atlas HR" };

const docTypeLabels: Record<string, string> = {
  passport:    "Passport",
  national_id: "National ID",
  work_permit: "Work Permit",
  contract:    "Employment Contract",
  nda:         "NDA",
  offer_letter:"Offer Letter",
  tax_form:    "Tax Form",
  bank_details:"Bank Details",
  certificate: "Certificate",
  other:       "Other",
};

export default async function OrgDocumentsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, department")
    .eq("org_id", orgCtx.org.id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  const allEmployees = (employees ?? []) as Array<{ id: string; full_name: string; department: string | null }>;
  const empIds = allEmployees.map((e) => e.id);

  const { data: docs } = empIds.length
    ? await supabase
        .from("employee_documents")
        .select("*")
        .in("employee_id", empIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const allDocs = docs ?? [];
  const empMap = Object.fromEntries(allEmployees.map((e) => [e.id, e]));

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);
  const expiringSoon = allDocs.filter((d) => {
    if (!d.expires_at) return false;
    const exp = new Date(d.expires_at);
    return exp >= today && exp <= in30;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Employee Documents</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                {allDocs.length} document{allDocs.length !== 1 ? "s" : ""} across {allEmployees.length} employees
                {expiringSoon.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-amber-400/30">
                    {expiringSoon.length} expiring soon
                  </span>
                )}
              </p>
            </div>
          </div>
          {orgCtx.isAdmin && (
            <Link href="/org/documents/new"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add document
            </Link>
          )}
        </div>
      </div>

      {/* Expiring soon banner */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {expiringSoon.length} document{expiringSoon.length !== 1 ? "s" : ""} expiring within 30 days
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {expiringSoon.map((d) => `${empMap[d.employee_id]?.full_name ?? "Unknown"} — ${docTypeLabels[d.doc_type] ?? d.doc_type}`).join(", ")}
            </p>
          </div>
        </div>
      )}

      <OrgDocumentsClient
        docs={allDocs}
        empMap={empMap}
        docTypeLabels={docTypeLabels}
        isAdmin={orgCtx.isAdmin}
      />
    </div>
  );
}
