"use client";

import { useActionState, useState } from "react";
import type { Employee } from "@/types/database";
import { updateMyProfile } from "./actions";
import type { ActionResult } from "./actions";

export function ProfilePortalClient({ employee }: { employee: Employee }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateMyProfile, null);

  return (
    <div className="space-y-6">
      {/* Read-only summary */}
      <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100">
          <h2 className="font-semibold text-navy-900 text-sm">Employment details</h2>
          <p className="text-xs text-slate-400 mt-0.5">Managed by your HR admin</p>
        </div>
        <dl className="divide-y divide-navy-50">
          {[
            { label: "Full name", value: employee.full_name },
            { label: "Job title", value: employee.job_title },
            { label: "Department", value: employee.department },
            { label: "Employment type", value: employee.employment_type?.replace(/_/g, " ") },
            { label: "Status", value: employee.status },
            { label: "Start date", value: employee.start_date ? new Date(employee.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null },
          ].map((row) => (
            <div key={row.label} className="flex items-center px-5 py-3 gap-4">
              <dt className="w-40 shrink-0 text-xs font-semibold text-slate-400">{row.label}</dt>
              <dd className="text-sm text-navy-900 capitalize">{row.value ?? <span className="text-slate-300">—</span>}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Editable personal details */}
      <div className="rounded-[18px] border border-navy-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
          <div>
            <h2 className="font-semibold text-navy-900 text-sm">Personal &amp; contact details</h2>
            <p className="text-xs text-slate-400 mt-0.5">You can update these yourself</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-[8px] border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form
            action={async (fd) => {
              await action(fd);
              if (!state?.error) setEditing(false);
            }}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={employee.phone ?? ""}
                  placeholder="+44 7700 900 000"
                  className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">Emergency contact name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  defaultValue={employee.emergency_contact_name ?? ""}
                  placeholder="Full name"
                  className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Home address</label>
              <textarea
                name="address"
                rows={2}
                defaultValue={employee.address ?? ""}
                placeholder="Street, City, Postcode"
                className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">Emergency contact phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                defaultValue={employee.emergency_contact_phone ?? ""}
                placeholder="+44 7700 900 000"
                className="w-full rounded-[10px] border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-[10px] border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-[10px] bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <dl className="divide-y divide-navy-50">
            {[
              { label: "Phone", value: employee.phone },
              { label: "Address", value: employee.address },
              { label: "Emergency contact", value: employee.emergency_contact_name },
              { label: "Emergency phone", value: employee.emergency_contact_phone },
            ].map((row) => (
              <div key={row.label} className="flex items-center px-5 py-3 gap-4">
                <dt className="w-40 shrink-0 text-xs font-semibold text-slate-400">{row.label}</dt>
                <dd className="text-sm text-navy-900">{row.value ?? <span className="text-slate-300">Not set</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {state?.success && !editing && (
        <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
          Profile updated successfully.
        </p>
      )}
    </div>
  );
}
