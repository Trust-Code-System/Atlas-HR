import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getMyEmployee } from "@/lib/portal/get-my-employee";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Documents | Atlas HR" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: "Employment Contract",
  offer_letter: "Offer Letter",
  id: "ID Document",
  passport: "Passport",
  right_to_work: "Right to Work",
  nda: "NDA",
  policy_acknowledgment: "Policy Acknowledgment",
  payslip: "Payslip",
  certificate: "Certificate",
  other: "Other",
};

export default async function PortalDocumentsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const employee = await getMyEmployee();

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-6 text-center mt-8">
          <p className="text-sm text-amber-700">Your account is not linked to an employee record. Ask your HR admin to link your profile.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Documents</h1>
            <p className="text-emerald-300 text-sm mt-0.5">
              {docs?.length ?? 0} document{docs?.length !== 1 ? "s" : ""} on file
            </p>
          </div>
        </div>
      </div>

      {!docs || docs.length === 0 ? (
        <div className="rounded-[18px] border border-navy-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-navy-700 font-semibold text-sm">No documents yet</p>
          <p className="text-slate-400 text-xs mt-1">Your HR admin will upload documents to your profile.</p>
        </div>
      ) : (
        <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-navy-50">
            {docs.map((doc) => {
              const isExpired = doc.expires_at && new Date(doc.expires_at) < new Date();
              const expiresSoon =
                !isExpired &&
                doc.expires_at &&
                new Date(doc.expires_at) < new Date(Date.now() + 30 * 86_400_000);

              return (
                <div key={doc.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy-900 text-sm truncate">{doc.file_name}</p>
                      {isExpired && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 bg-red-50 text-red-700 ring-red-200">Expired</span>
                      )}
                      {expiresSoon && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">Expires soon</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                      {" · "}Uploaded {formatDate(doc.created_at)}
                      {doc.expires_at && ` · Expires ${formatDate(doc.expires_at)}`}
                    </p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 rounded-[8px] border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    View
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
