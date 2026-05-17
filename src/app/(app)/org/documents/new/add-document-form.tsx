"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addEmployeeDocument } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

const DOC_TYPES = [
  { value: "contract", label: "Employment Contract" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "nda", label: "NDA" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "work_permit", label: "Work Permit" },
  { value: "tax_form", label: "Tax Form" },
  { value: "bank_details", label: "Bank Details" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
];

interface Props {
  employees: Array<{ id: string; full_name: string }>;
}

export function AddDocumentForm({ employees }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(addEmployeeDocument, null);

  useEffect(() => {
    if (state?.success) router.push("/org/documents");
  }, [state, router]);

  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-6">
      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="doc_employee" className={labelCls}>Employee <span className="text-red-500">*</span></label>
          <Select
            id="doc_employee"
            name="employee_id"
            required
            options={[{ value: "", label: "Select employee…" }, ...employees.map((e) => ({ value: e.id, label: e.full_name }))]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="doc_type" className={labelCls}>Document type <span className="text-red-500">*</span></label>
            <Select id="doc_type" name="doc_type" required options={DOC_TYPES} />
          </div>
          <div>
            <label className={labelCls}>Expiry date</label>
            <DatePicker name="expires_at" placeholder="No expiry" />
          </div>
        </div>

        <div>
          <label className={labelCls}>File name <span className="text-red-500">*</span></label>
          <Input name="file_name" placeholder="e.g. john_smith_contract_2026.pdf" required />
        </div>

        <div>
          <label className={labelCls}>File URL <span className="text-red-500">*</span></label>
          <Input name="file_url" type="url" placeholder="https://…" required />
          <p className="text-xs text-navy-400 mt-1">Paste a link to the file hosted in Google Drive, Dropbox, S3, etc.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/org/documents" className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>Save document</Button>
        </div>
      </form>
    </div>
  );
}
