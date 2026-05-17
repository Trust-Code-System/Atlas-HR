"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CountryKey = "nigeria" | "india" | "uk" | "us";
type RoleKey = "software-engineer" | "people-ops" | "sales-manager" | "support-lead";
type EngagementKey = "employee" | "contractor" | "employer-of-record";

const countries: Record<
  CountryKey,
  {
    label: string;
    currency: string;
    defaultSalary: number;
    employerLoad: number;
    riskBase: number;
    obligations: string[];
    risks: string[];
    nextStep: string;
  }
> = {
  nigeria: {
    label: "Nigeria",
    currency: "NGN",
    defaultSalary: 36000000,
    employerLoad: 0.19,
    riskBase: 58,
    obligations: ["PAYE evidence", "Pension and group life", "NSITF and payroll records"],
    risks: ["Contractor misclassification", "Final settlement documentation", "Statutory remittance gaps"],
    nextStep: "Generate a Nigeria employment contract and payroll checklist.",
  },
  india: {
    label: "India",
    currency: "INR",
    defaultSalary: 4200000,
    employerLoad: 0.22,
    riskBase: 64,
    obligations: ["PF, ESI, and professional tax checks", "State-aware leave", "Gratuity exposure"],
    risks: ["State Shops and Establishments variation", "Contractor conversion risk", "Notice and leave encashment"],
    nextStep: "Build an India offer pack with state-aware checkpoints.",
  },
  uk: {
    label: "United Kingdom",
    currency: "GBP",
    defaultSalary: 85000,
    employerLoad: 0.18,
    riskBase: 61,
    obligations: ["PAYE and National Insurance", "Pension auto-enrolment", "Written particulars"],
    risks: ["Worker status", "Fair dismissal process", "Holiday and final pay calculations"],
    nextStep: "Create the UK hire workflow with right-to-work and payroll tasks.",
  },
  us: {
    label: "United States",
    currency: "USD",
    defaultSalary: 135000,
    employerLoad: 0.24,
    riskBase: 67,
    obligations: ["Federal, state, and local payroll", "I-9 and tax forms", "State-specific notices"],
    risks: ["Multi-state policy gaps", "Exempt status errors", "Final pay deadline variation"],
    nextStep: "Create a multi-state offer and handbook review workflow.",
  },
};

const roleMultipliers: Record<RoleKey, number> = {
  "software-engineer": 1,
  "people-ops": 0.72,
  "sales-manager": 0.88,
  "support-lead": 0.58,
};

const engagementRisk: Record<EngagementKey, number> = {
  employee: 0,
  contractor: 18,
  "employer-of-record": -8,
};

const countryOptions = [
  { value: "nigeria", label: "Nigeria" },
  { value: "india", label: "India" },
  { value: "uk", label: "United Kingdom" },
  { value: "us", label: "United States" },
];

const roleOptions = [
  { value: "software-engineer", label: "Software engineer" },
  { value: "people-ops", label: "People operations" },
  { value: "sales-manager", label: "Sales manager" },
  { value: "support-lead", label: "Support lead" },
];

const engagementOptions = [
  { value: "employee", label: "Direct employee" },
  { value: "contractor", label: "Contractor" },
  { value: "employer-of-record", label: "Employer of record" },
];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function GlobalHiringCalculator() {
  const [country, setCountry] = useState<CountryKey>("nigeria");
  const [role, setRole] = useState<RoleKey>("software-engineer");
  const [engagement, setEngagement] = useState<EngagementKey>("employee");
  const [salary, setSalary] = useState(countries.nigeria.defaultSalary);
  const [headcount, setHeadcount] = useState(3);
  const [email, setEmail] = useState("");

  const result = useMemo(() => {
    const data = countries[country];
    const normalizedSalary = Math.max(0, Number(salary) || 0);
    const normalizedHeadcount = Math.max(1, Number(headcount) || 1);
    const roleAdjustedSalary = normalizedSalary * roleMultipliers[role];
    const annualEmployerCost = roleAdjustedSalary * (1 + data.employerLoad) * normalizedHeadcount;
    const monthlyEmployerCost = annualEmployerCost / 12;
    const riskScore = Math.max(
      18,
      Math.min(95, Math.round(data.riskBase + engagementRisk[engagement] + (normalizedHeadcount > 10 ? 8 : 0)))
    );

    return {
      data,
      roleAdjustedSalary,
      annualEmployerCost,
      monthlyEmployerCost,
      riskScore,
      riskLabel: riskScore >= 70 ? "High review need" : riskScore >= 50 ? "Moderate review need" : "Lower review need",
    };
  }, [country, engagement, headcount, role, salary]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="calculator-country">Hiring country</Label>
            <Select
              id="calculator-country"
              value={country}
              options={countryOptions}
              onChange={(value) => {
                const nextCountry = value as CountryKey;
                setCountry(nextCountry);
                setSalary(countries[nextCountry].defaultSalary);
              }}
            />
          </div>
          <div>
            <Label htmlFor="calculator-role">Role</Label>
            <Select
              id="calculator-role"
              value={role}
              options={roleOptions}
              onChange={(value) => setRole(value as RoleKey)}
            />
          </div>
          <div>
            <Label htmlFor="calculator-engagement">Engagement model</Label>
            <Select
              id="calculator-engagement"
              value={engagement}
              options={engagementOptions}
              onChange={(value) => setEngagement(value as EngagementKey)}
            />
          </div>
          <div>
            <Label htmlFor="calculator-headcount">Headcount</Label>
            <Input
              id="calculator-headcount"
              min={1}
              type="number"
              value={headcount}
              onChange={(event) => setHeadcount(Number(event.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="calculator-salary">Annual base salary benchmark</Label>
            <Input
              id="calculator-salary"
              min={0}
              step={1000}
              type="number"
              value={salary}
              onChange={(event) => setSalary(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lead magnet preview
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Save this estimate, generate a country-specific checklist, and continue into
            contracts, payroll setup, onboarding, and access removal workflows.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              type="email"
              placeholder="work email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Work email"
            />
            <Link
              href={`/sign-up?intent=global-hiring&country=${country}&email=${encodeURIComponent(email)}`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Save checklist
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy-800 bg-navy-950 p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
              Estimated employer cost
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {formatMoney(result.annualEmployerCost, result.data.currency)}
            </p>
            <p className="text-sm text-navy-400">
              {formatMoney(result.monthlyEmployerCost, result.data.currency)} monthly for {headcount} hire{headcount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs text-navy-400">Risk score</p>
            <p className="text-2xl font-bold text-amber-300">{result.riskScore}</p>
            <p className="text-xs font-semibold text-navy-300">{result.riskLabel}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Mandatory checks</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-300">
              {result.data.obligations.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Compliance risks</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-300">
              {result.data.risks.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
          <p className="text-sm font-semibold text-blue-100">{result.data.nextStep}</p>
          <p className="mt-1 text-xs leading-5 text-navy-300">
            Estimates are directional for product demo purposes and should be reviewed
            against current local law, payroll rules, and company policy.
          </p>
        </div>
      </div>
    </div>
  );
}
