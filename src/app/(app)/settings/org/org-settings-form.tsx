"use client";

import { useActionState } from "react";
import { updateOrgSettings } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Organisation } from "@/types/database";

const labelCls = "text-xs font-semibold text-navy-600 uppercase tracking-wide block mb-1.5";

const INDUSTRIES = [
  "Agriculture", "Construction", "Education", "Energy", "Finance",
  "Healthcare", "Hospitality", "Legal", "Manufacturing", "Media",
  "Non-profit", "Professional Services", "Real Estate", "Retail",
  "Technology", "Transportation", "Other",
];

const COUNTRIES = [
  "Australia", "Brazil", "Canada", "France", "Germany", "Ghana",
  "India", "Ireland", "Kenya", "Mexico", "Netherlands", "New Zealand",
  "Nigeria", "Singapore", "South Africa", "Spain", "Sweden",
  "United Arab Emirates", "United Kingdom", "United States",
];

const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

const PLAN_LABELS: Record<string, string> = {
  team: "Team",
  business: "Business",
  enterprise: "Enterprise",
};

interface Props {
  org: Organisation;
}

export function OrgSettingsForm({ org }: Props) {
  const [state, formAction, isPending] = useActionState(updateOrgSettings, null);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-1">Organisation profile</h2>
        <p className="text-sm text-navy-400 mb-5">Update your organisation&apos;s name and details.</p>

        {state?.success && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Organisation settings saved.
          </div>
        )}
        {state?.error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className={labelCls}>Organisation name <span className="text-red-500">*</span></label>
            <Input name="name" defaultValue={org.name} placeholder="Acme Corp" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="org_industry" className={labelCls}>Industry</label>
              <Select
                id="org_industry"
                name="industry"
                defaultValue={org.industry ?? ""}
                options={[{ value: "", label: "Select industry…" }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))]}
              />
            </div>
            <div>
              <label htmlFor="org_country" className={labelCls}>Country</label>
              <Select
                id="org_country"
                name="country"
                defaultValue={org.country ?? ""}
                options={[{ value: "", label: "Select country…" }, ...COUNTRIES.map((c) => ({ value: c, label: c }))]}
              />
            </div>
            <div>
              <label htmlFor="org_size" className={labelCls}>Company size</label>
              <Select
                id="org_size"
                name="size"
                defaultValue={org.size ?? ""}
                options={[{ value: "", label: "Select size…" }, ...SIZES.map((s) => ({ value: s, label: s }))]}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isPending} size="sm">Save changes</Button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-navy-200 p-6">
        <h2 className="font-semibold text-navy-900 mb-1">Plan</h2>
        <p className="text-sm text-navy-400 mb-3">Your current subscription.</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700">
            {PLAN_LABELS[org.plan] ?? org.plan}
          </span>
          <span className="text-sm text-navy-500">To upgrade, contact support.</span>
        </div>
      </section>
    </div>
  );
}
