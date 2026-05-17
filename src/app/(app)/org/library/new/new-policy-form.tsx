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
    if (state?.success) router.push("/org/library");
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

        <div>
          <label className={labelCls}>File URL</label>
          <Input name="file_url" type="url" placeholder="https://drive.google.com/…" />
          <p className="text-xs text-navy-400 mt-1">Optional link to the full policy document.</p>
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
