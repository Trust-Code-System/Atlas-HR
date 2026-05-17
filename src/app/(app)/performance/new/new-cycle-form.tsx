"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPerformanceCycle } from "../actions";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export function NewCycleForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPerformanceCycle, null);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/performance/${state.id}`);
  }, [state, router]);

  const def = defaultDates();

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
          <label className={labelCls}>Cycle name <span className="text-red-500">*</span></label>
          <Input name="name" placeholder="e.g. 2026 Annual Review" required />
        </div>

        <div>
          <label className={labelCls}>Cycle type</label>
          <Select
            name="type"
            options={[
              { value: "annual", label: "Annual" },
              { value: "mid_year", label: "Mid-year" },
              { value: "quarterly", label: "Quarterly" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start date <span className="text-red-500">*</span></label>
            <DatePicker name="start_date" defaultValue={def.start} placeholder="Start date" />
          </div>
          <div>
            <label className={labelCls}>End date <span className="text-red-500">*</span></label>
            <DatePicker name="end_date" defaultValue={def.end} placeholder="End date" />
          </div>
        </div>

        <div className="bg-navy-50 border border-navy-200 rounded-xl px-4 py-3 text-xs text-navy-600">
          A <strong>pending review</strong> will be created for every active employee, assigned to their manager as the reviewer.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/performance"
            className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>
            Create cycle
          </Button>
        </div>
      </form>
    </div>
  );
}
