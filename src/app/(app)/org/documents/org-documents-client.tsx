"use client";

import { useTransition, useState } from "react";
import { deleteEmployeeDocument } from "./actions";

interface Doc {
  id: string;
  employee_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  expires_at: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  department: string | null;
}

interface Props {
  docs: Doc[];
  empMap: Record<string, Employee>;
  docTypeLabels: Record<string, string>;
  isAdmin: boolean;
}

const docTypeIcons: Record<string, string> = {
  passport: "🪪",
  national_id: "🪪",
  work_permit: "📋",
  contract: "📝",
  nda: "🔒",
  offer_letter: "✉️",
  tax_form: "🧾",
  certificate: "🏆",
};

function DeleteButton({ docId }: { docId: string }) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  function handle() {
    if (!confirm("Delete this document?")) return;
    startTransition(async () => {
      await deleteEmployeeDocument(docId);
      setDeleted(true);
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="text-xs text-navy-400 hover:text-red-600 transition-colors disabled:opacity-50"
      aria-label="Delete document"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

export function OrgDocumentsClient({ docs, empMap, docTypeLabels, isAdmin }: Props) {
  const [filter, setFilter] = useState("");

  const today = new Date();
  const filtered = docs.filter((d) => {
    if (!filter) return true;
    const emp = empMap[d.employee_id];
    return (
      emp?.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      d.doc_type.toLowerCase().includes(filter.toLowerCase()) ||
      d.file_name.toLowerCase().includes(filter.toLowerCase())
    );
  });

  function expiryStatus(exp: string | null) {
    if (!exp) return null;
    const expDate = new Date(exp);
    const diff = (expDate.getTime() - today.getTime()) / 86400000;
    if (diff < 0) return { label: "Expired", cls: "bg-red-100 text-red-700" };
    if (diff <= 30) return { label: "Expiring soon", cls: "bg-amber-100 text-amber-700" };
    return { label: `Exp. ${expDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`, cls: "bg-navy-100 text-navy-600" };
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter by employee, type, or filename…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 h-10 rounded-xl border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50 border-b border-navy-200 text-xs font-semibold text-navy-500 uppercase tracking-wide">
              <div className="col-span-3">Employee</div>
              <div className="col-span-3">Document</div>
              <div className="col-span-3">File</div>
              <div className="col-span-2">Expiry</div>
              {isAdmin && <div className="col-span-1" />}
            </div>
            <div className="divide-y divide-navy-100">
              {filtered.map((doc) => {
                const emp = empMap[doc.employee_id];
                const expiry = expiryStatus(doc.expires_at);
                const icon = docTypeIcons[doc.doc_type] ?? "📄";
                return (
                  <div key={doc.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate">{emp?.full_name ?? "Unknown"}</p>
                      {emp?.department && <p className="text-xs text-navy-400 truncate">{emp.department}</p>}
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-navy-700">{icon} {docTypeLabels[doc.doc_type] ?? doc.doc_type}</span>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                      >
                        {doc.file_name}
                      </a>
                    </div>
                    <div className="col-span-2">
                      {expiry ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${expiry.cls}`}>
                          {expiry.label}
                        </span>
                      ) : (
                        <span className="text-xs text-navy-400">—</span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="col-span-1 flex justify-end">
                        <DeleteButton docId={doc.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-navy-900 mb-1">
              {filter ? "No documents match" : "No documents yet"}
            </p>
            <p className="text-sm text-navy-500">
              {filter ? "Try a different search." : "Add employee documents to keep records organised."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
