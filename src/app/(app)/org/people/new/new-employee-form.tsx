"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createEmployee } from "../actions";
import Link from "next/link";

interface Manager {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const SALARY_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "INR", label: "INR — Indian Rupee" },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function NewEmployeeForm({ managers }: { managers: Manager[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createEmployee, null);

  useEffect(() => {
    if (state?.success && state.id) {
      router.push(`/org/people/${state.id}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      {/* Personal */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-4">Personal information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Full name</FieldLabel>
            <Input name="full_name" placeholder="Jane Smith" required />
          </div>
          <div>
            <FieldLabel>Work email</FieldLabel>
            <Input name="email" type="email" placeholder="jane@company.com" />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <Input name="phone" placeholder="+1 555 000 0000" />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <Input name="country" placeholder="e.g. United Kingdom" />
          </div>
        </div>
      </section>

      {/* Employment */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-4">Employment details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Job title</FieldLabel>
            <Input name="job_title" placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <FieldLabel>Department</FieldLabel>
            <Input name="department" placeholder="e.g. Engineering" />
          </div>
          <div>
            <FieldLabel>Employment type</FieldLabel>
            <Select name="employment_type" options={EMPLOYMENT_TYPE_OPTIONS} />
          </div>
          <div>
            <FieldLabel>Start date</FieldLabel>
            <DatePicker name="start_date" placeholder="Select start date" />
          </div>
          {managers.length > 0 && (
            <div>
              <FieldLabel>Manager</FieldLabel>
              <Select
                name="manager_id"
                options={[
                  { value: "", label: "Atlas AI auto-place" },
                  ...managers.map((m) => ({
                    value: m.id,
                    label: `${m.full_name}${m.job_title ? ` - ${m.job_title}` : ""}`,
                  })),
                ]}
              />
              <p className="mt-1.5 text-xs text-navy-400">
                Leave as auto-place and Atlas will place this person under the likely department head or manager.
              </p>
            </div>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-3 py-3 text-sm text-navy-700">
            <input
              type="checkbox"
              name="is_department_head"
              className="mt-0.5 h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600"
            />
            <span>
              <span className="block font-semibold text-navy-800">Mark as department head</span>
              <span className="text-xs text-navy-500">This person will appear as the head in the organogram department summary.</span>
            </span>
          </label>
        </div>
      </section>

      {/* Compensation */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-4">Compensation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Annual salary</FieldLabel>
            <Input name="salary" type="number" step="0.01" placeholder="60000" />
          </div>
          <div>
            <FieldLabel>Currency</FieldLabel>
            <Select name="salary_currency" defaultValue="USD" options={SALARY_CURRENCY_OPTIONS} />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/org/people"
          className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
        >
          Cancel
        </Link>
        <Button type="submit" loading={isPending}>
          Add employee
        </Button>
      </div>
    </form>
  );
}
