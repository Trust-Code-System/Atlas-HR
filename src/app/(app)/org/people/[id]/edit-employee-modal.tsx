"use client";

import { useActionState, useEffect, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateEmployee } from "../actions";
import type { Employee } from "@/types/database";

interface Manager {
  id: string;
  full_name: string;
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
];

const SALARY_CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "CAD", "AUD", "NGN", "GHS", "KES", "ZAR", "INR"].map((currency) => ({
  value: currency,
  label: currency,
}));

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function EditEmployeeModal({
  employee,
  managers,
}: {
  employee: Employee;
  managers: Manager[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const boundAction = updateEmployee.bind(null, employee.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.success) {
      const timer = window.setTimeout(() => setIsOpen(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state]);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 border border-navy-200 bg-white hover:bg-navy-50 px-3 py-1.5 rounded-lg transition-colors shrink-0"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal
          aria-label="Edit employee"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
              <h2 className="font-semibold text-navy-900 text-lg">Edit employee</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {state?.error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {state.error}
                </div>
              )}

              <form id="edit-employee-form" action={formAction} className="space-y-4">
                {/* Personal */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest">Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Full name</FieldLabel>
                    <Input name="full_name" defaultValue={employee.full_name} required />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <Input name="email" type="email" defaultValue={employee.email ?? ""} />
                  </div>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <Input name="phone" defaultValue={employee.phone ?? ""} />
                  </div>
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <Input name="country" defaultValue={employee.country ?? ""} placeholder="e.g. United Kingdom" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Address</FieldLabel>
                    <Input name="address" defaultValue={employee.address ?? ""} />
                  </div>
                </div>

                {/* Employment */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest pt-2">Employment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Job title</FieldLabel>
                    <Input name="job_title" defaultValue={employee.job_title ?? ""} />
                  </div>
                  <div>
                    <FieldLabel>Department</FieldLabel>
                    <Input name="department" defaultValue={employee.department ?? ""} />
                  </div>
                  <div>
                    <FieldLabel>Employment type</FieldLabel>
                    <Select name="employment_type" defaultValue={employee.employment_type ?? ""} options={EMPLOYMENT_TYPE_OPTIONS} />
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <Select name="status" defaultValue={employee.status} options={EMPLOYEE_STATUS_OPTIONS} />
                  </div>
                  <div>
                    <FieldLabel>Start date</FieldLabel>
                    <DatePicker name="start_date" defaultValue={employee.start_date ?? ""} placeholder="Select start date" />
                  </div>
                  <div>
                    <FieldLabel>End date</FieldLabel>
                    <DatePicker name="end_date" defaultValue={employee.end_date ?? ""} placeholder="Select end date" />
                  </div>
                  <div>
                    <FieldLabel>Manager</FieldLabel>
                    <Select
                      name="manager_id"
                      defaultValue={employee.manager_id ?? ""}
                      options={[
                        { value: "", label: "None" },
                        ...managers
                          .filter((m) => m.id !== employee.id)
                          .map((m) => ({ value: m.id, label: m.full_name })),
                      ]}
                    />
                  </div>
                  <label className="flex items-start gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-3 py-3 text-sm text-navy-700">
                    <input
                      type="checkbox"
                      name="is_department_head"
                      defaultChecked={employee.is_department_head ?? false}
                      className="mt-0.5 h-4 w-4 rounded border-navy-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span>
                      <span className="block font-semibold text-navy-800">Department head</span>
                      <span className="text-xs text-navy-500">Show this employee as the head for their department.</span>
                    </span>
                  </label>
                </div>

                {/* Compensation */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest pt-2">Compensation</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Annual salary</FieldLabel>
                    <Input name="salary" type="number" step="0.01" defaultValue={employee.salary?.toString() ?? ""} placeholder="60000" />
                  </div>
                  <div>
                    <FieldLabel>Currency</FieldLabel>
                    <Select name="salary_currency" defaultValue={employee.salary_currency ?? "USD"} options={SALARY_CURRENCY_OPTIONS} />
                  </div>
                </div>

                {/* Emergency contact */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest pt-2">Emergency contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Contact name</FieldLabel>
                    <Input name="emergency_contact_name" defaultValue={employee.emergency_contact_name ?? ""} />
                  </div>
                  <div>
                    <FieldLabel>Contact phone</FieldLabel>
                    <Input name="emergency_contact_phone" defaultValue={employee.emergency_contact_phone ?? ""} />
                  </div>
                </div>

                {/* Online */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest pt-2">Online</p>
                <div>
                  <FieldLabel>LinkedIn profile URL</FieldLabel>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Input name="linkedin_url" type="url" defaultValue={(employee as any).linkedin_url ?? ""} placeholder="https://linkedin.com/in/username" />
                </div>

                {/* Notes */}
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest pt-2">Notes</p>
                <Textarea name="notes" defaultValue={employee.notes ?? ""} rows={3} placeholder="Internal notes about this employee…" />
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-navy-600 hover:text-navy-800 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <Button form="edit-employee-form" type="submit" loading={isPending}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
