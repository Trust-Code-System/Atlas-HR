"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPayrollRun } from "../actions";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

const currencies = ["GBP", "USD", "EUR", "AUD", "CAD", "SGD", "AED", "NGN"];

// Default pay period: previous month
function defaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    name: start.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + " Payroll",
  };
}

export function NewPayrollRunForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPayrollRun, null);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/payroll/${state.id}`);
  }, [state, router]);

  const def = defaultPeriod();

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
          <label className={labelCls}>Run name <span className="text-red-500">*</span></label>
          <Input name="name" defaultValue={def.name} placeholder="e.g. April 2026 Payroll" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Pay period start <span className="text-red-500">*</span></label>
            <DatePicker name="pay_period_start" defaultValue={def.start} placeholder="Start date" />
          </div>
          <div>
            <label className={labelCls}>Pay period end <span className="text-red-500">*</span></label>
            <DatePicker name="pay_period_end" defaultValue={def.end} placeholder="End date" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Currency</label>
          <Select name="currency" defaultValue="GBP" options={currencies.map((c) => ({ value: c, label: c }))} />
        </div>

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <Input name="notes" placeholder="Any notes for this payroll run…" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <strong>Note:</strong> Entries are auto-populated from active employees with a salary on file. Deductions are calculated at a standard 32% rate (20% income tax + 12% NI) for demonstration. You can adjust entries after creation.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/payroll"
            className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" loading={isPending}>
            Create payroll run
          </Button>
        </div>
      </form>
    </div>
  );
}
