"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPolicyDocument } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "leave", label: "Leave & Absence" },
  { value: "conduct", label: "Code of Conduct" },
  { value: "safety", label: "Health & Safety" },
  { value: "compensation", label: "Compensation" },
  { value: "benefits", label: "Benefits" },
  { value: "performance", label: "Performance" },
  { value: "it", label: "IT & Security" },
  { value: "diversity", label: "Diversity & Inclusion" },
  { value: "legal", label: "Legal & Compliance" },
];

export function NewPolicyForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPolicyDocument, null);

  useEffect(() => {
    // Redirect on a clean success; if indexing warned, keep the page so the
    // admin sees the message and can decide whether to re-upload.
    if (state?.success && !state.warning) router.push("/org/library");
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

        {state?.warning && (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p>{state.warning}</p>
              <Link href="/org/library" className="font-semibold underline">Go to Policy Library</Link>
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Title <span className="text-red-500">*</span></label>
          <Input name="title" placeholder="e.g. Annual Leave Policy" required />
        </div>

        <div>
          <label htmlFor="policy_category" className={labelCls}>Category</label>
          <Select id="policy_category" name="category" options={CATEGORIES} />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            name="description"
            className="flex min-h-[80px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            placeholder="Brief summary of this policy…"
          />
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-semibold text-navy-800">Index for Atlas AI <span className="font-normal text-navy-500">(optional)</span></p>
          </div>
          <p className="text-xs text-navy-500">
            Upload the policy file or paste its text and Atlas AI will answer employee questions grounded in this document, with citations. Supports PDF, Word (.docx), and plain text.
          </p>
          <div>
            <label className={labelCls}>Upload file</label>
            <input
              name="file"
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              className="block w-full text-sm text-navy-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-700 hover:file:bg-navy-200"
            />
          </div>
          <div>
            <label className={labelCls}>…or paste policy text</label>
            <textarea
              name="body_text"
              className="flex min-h-20 w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y"
              placeholder="Paste the full policy text here to make it searchable by Atlas AI…"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>File URL</label>
          <Input name="file_url" type="url" placeholder="https://drive.google.com/…" />
          <p className="text-xs text-navy-400 mt-1">Optional link to the full policy document (shown as a “View” link).</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input type="hidden" name="is_published" value="true" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              defaultChecked
              className="h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600"
              onChange={(e) => {
                const hidden = e.currentTarget.form?.querySelector('input[name="is_published"][type="hidden"]') as HTMLInputElement | null;
                if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
              }}
            />
            <span className="text-sm text-navy-700">Publish immediately</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/org/library" className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>Save policy</Button>
        </div>
      </form>
    </div>
  );
}
