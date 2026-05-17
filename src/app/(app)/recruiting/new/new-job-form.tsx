"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";
const textareaCls =
  "flex min-h-[90px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none";

export function NewJobForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createJob, null);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/recruiting/${state.id}`);
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
          <label className={labelCls}>Job title <span className="text-red-500">*</span></label>
          <Input name="title" placeholder="e.g. Senior Product Designer" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Department</label>
            <Input name="department" placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <Input name="location" placeholder="e.g. London / Remote" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Employment type</label>
            <Select
              name="employment_type"
              options={[
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
                { value: "contract", label: "Contract" },
                { value: "intern", label: "Intern" },
              ]}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <Select
              name="status"
              options={[
                { value: "open", label: "Open — accepting applications" },
                { value: "draft", label: "Draft — not yet published" },
              ]}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Job description</label>
          <textarea name="description" className={textareaCls} placeholder="Describe the role, responsibilities, and what success looks like…" />
        </div>

        <div>
          <label className={labelCls}>Requirements</label>
          <textarea name="requirements" className={textareaCls} placeholder="Skills, experience, and qualifications required…" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/recruiting" className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>Post job</Button>
        </div>
      </form>
    </div>
  );
}
