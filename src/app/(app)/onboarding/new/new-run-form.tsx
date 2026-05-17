"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startRun } from "../actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import Link from "next/link";

const selectCls =
  "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

interface Employee {
  id: string;
  full_name: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
}

interface Props {
  employees: Employee[];
  templates: Template[];
}

export function NewRunForm({ employees, templates }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(startRun, null);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/onboarding/${state.id}`);
  }, [state, router]);

  const today = new Date().toISOString().split("T")[0];
  const onboardingTemplates = templates.filter((t) => t.type === "onboarding");
  const offboardingTemplates = templates.filter((t) => t.type === "offboarding");

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
          <label htmlFor="employee_id" className={labelCls}>Employee <span className="text-red-500">*</span></label>
          <Select
            id="employee_id"
            name="employee_id"
            required
            options={[{ value: "", label: "Select employee…" }, ...employees.map((e) => ({ value: e.id, label: e.full_name }))]}
          />
        </div>

        <div>
          <label htmlFor="run_type" className={labelCls}>Run type</label>
          <Select
            id="run_type"
            name="type"
            options={[
              { value: "onboarding", label: "Onboarding" },
              { value: "offboarding", label: "Offboarding" },
            ]}
          />
        </div>

        <div>
          <label htmlFor="template_id" className={labelCls}>Template <span className="text-red-500">*</span></label>
          <Select
            id="template_id"
            name="template_id"
            required
            options={[
              { value: "", label: "Select template…" },
              ...onboardingTemplates.map((t) => ({ value: t.id, label: `Onboarding · ${t.name}` })),
              ...offboardingTemplates.map((t) => ({ value: t.id, label: `Offboarding · ${t.name}` })),
            ]}
          />
          {templates.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5">
              No templates yet. <Link href="/onboarding/templates/new" className="underline">Create one first.</Link>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reference_date" className={labelCls}>Start / reference date <span className="text-red-500">*</span></label>
          <DatePicker
            id="reference_date"
            name="reference_date"
            defaultValue={today}
            placeholder="Select start date"
          />
          <p className="text-xs text-navy-400 mt-1">Task due dates are calculated relative to this date.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/onboarding" className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors">
            Cancel
          </Link>
          <Button type="submit" loading={isPending} disabled={templates.length === 0}>
            Start run
          </Button>
        </div>
      </form>
    </div>
  );
}
