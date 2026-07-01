"use client";

import { useMemo, useState } from "react";

type ActiveTool = "job-description-generator" | "offer-letter";

const countries = [
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "India", label: "India" },
];

const departments = ["Engineering", "Product", "Design", "Sales", "Marketing", "People", "Finance", "Operations"];
const levels = ["Entry-level", "Mid-level", "Senior", "Lead", "Director"];

function listFromText(value: string, fallback: string[]) {
  const items = value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
}

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildJobDescription(input: JobDescriptionInput) {
  const responsibilities = listFromText(input.responsibilities, [
    `Own the day-to-day outcomes for the ${input.jobTitle || "role"}.`,
    "Work cross-functionally with managers and stakeholders.",
    "Turn business goals into clear, measurable delivery plans.",
    "Document decisions, risks, and progress for the wider team.",
  ]);

  const skills = listFromText(input.skills, [
    "Strong written communication",
    "Structured problem-solving",
    "Experience working with distributed teams",
    "Comfort using modern SaaS tools",
  ]);

  return `# ${input.jobTitle || "Role title"}

## About the role
We are hiring a ${input.level.toLowerCase()} ${input.jobTitle || "team member"} for our ${input.department.toLowerCase()} team in ${input.country}. This person will help the team execute clearly, collaborate across borders, and maintain a high standard of documentation and accountability.

## What you will do
${bullets(responsibilities)}

## What we are looking for
${bullets(skills)}

## How success will be measured
- Clear ownership of role priorities in the first 30 days.
- Reliable execution against agreed goals and deadlines.
- Strong collaboration with managers, peers, and cross-functional partners.
- Clean documentation that helps the team make decisions faster.

## Inclusive hiring note
Atlas-style job posts should focus on genuine requirements, avoid inflated must-haves, and use accessible language for candidates from different markets.

Note: This is a directional HR template, not legal advice. Review country-specific requirements with HR or employment counsel before posting.`;
}

function buildOfferLetter(input: OfferLetterInput) {
  const startDate = input.startDate || "[start date]";
  const manager = input.reportingTo || "[manager name]";
  const benefits = listFromText(input.benefits, [
    "Paid annual leave in line with company policy",
    "Applicable statutory benefits",
    "Role-specific equipment and systems access",
  ]);

  return `Dear ${input.candidateName || "[candidate name]"},

We are pleased to offer you the position of ${input.jobTitle || "[job title]"} with AtlasHR. This offer is for the ${input.department || "[department]"} team in ${input.country}, with an expected start date of ${startDate}.

Your compensation will be ${input.compensation || "[compensation]"}, subject to applicable deductions, taxes, and payroll rules. You will report to ${manager}. Your work arrangement will be ${input.workArrangement.toLowerCase()} unless otherwise agreed in writing.

Key benefits include:
${bullets(benefits)}

This offer is conditional on completion of the company's standard onboarding checks, signed employment documentation, and any country-specific requirements that apply to this role.

To accept, please sign and return the final offer documents by the acceptance deadline shared by the hiring team.

Sincerely,

[Authorized signatory]

Note: This is a directional offer-letter draft, not legal advice. Review the final letter with HR or employment counsel before sending, especially for probation, notice, benefits, tax, and statutory-language requirements in ${input.country}.`;
}

type JobDescriptionInput = {
  jobTitle: string;
  department: string;
  level: string;
  country: string;
  responsibilities: string;
  skills: string;
};

type OfferLetterInput = {
  candidateName: string;
  jobTitle: string;
  department: string;
  startDate: string;
  compensation: string;
  country: string;
  reportingTo: string;
  workArrangement: string;
  benefits: string;
};

const defaultJobDescription: JobDescriptionInput = {
  jobTitle: "People Operations Manager",
  department: "People",
  level: "Senior",
  country: "Nigeria",
  responsibilities: "Own HR operations for distributed teams\nMaintain employee records and onboarding workflows\nPartner with finance on payroll inputs",
  skills: "HR operations\nEmployment documentation\nPayroll coordination\nClear stakeholder communication",
};

const defaultOfferLetter: OfferLetterInput = {
  candidateName: "Amina Okafor",
  jobTitle: "People Operations Manager",
  department: "People",
  startDate: "1 February 2026",
  compensation: "NGN 18,000,000 per year",
  country: "Nigeria",
  reportingTo: "Head of Operations",
  workArrangement: "Hybrid",
  benefits: "Health insurance\nPaid annual leave\nLaptop and work tools",
};

export function PublicToolPreview() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("job-description-generator");
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [offerLetter, setOfferLetter] = useState(defaultOfferLetter);

  const output = useMemo(() => {
    if (activeTool === "offer-letter") return buildOfferLetter(offerLetter);
    return buildJobDescription(jobDescription);
  }, [activeTool, jobDescription, offerLetter]);

  return (
    <section id="free-tool-preview" className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Free pre-signup tools</p>
          <h2 className="mt-2 text-3xl font-bold text-navy-900">Generate a useful draft before creating an account.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            These previews produce a copyable draft in the browser. Create an account when you want saved versions, approvals, workflow routing, and country review checks.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Free tool previews">
          <button
            type="button"
            role="tab"
            aria-selected={activeTool === "job-description-generator"}
            onClick={() => setActiveTool("job-description-generator")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTool === "job-description-generator"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            Job description
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTool === "offer-letter"}
            onClick={() => setActiveTool("offer-letter")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              activeTool === "offer-letter"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            Offer letter
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {activeTool === "job-description-generator" ? (
              <JobDescriptionForm value={jobDescription} onChange={setJobDescription} />
            ) : (
              <OfferLetterForm value={offerLetter} onChange={setOfferLetter} />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-navy-900">Draft output</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Copy this into your document editor, then review before use.</p>
              </div>
              <a href="/sign-up?intent=tools" className="shrink-0 rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800">
                Save in Atlas
              </a>
            </div>
            <pre className="mt-4 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              {output}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function textInput(value: string, onChange: (value: string) => void, placeholder?: string) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

function selectInput(value: string, onChange: (value: string) => void, options: string[] | { value: string; label: string }[]) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => {
        const item = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        );
      })}
    </select>
  );
}

function textareaInput(value: string, onChange: (value: string) => void, placeholder?: string) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

function JobDescriptionForm({
  value,
  onChange,
}: {
  value: JobDescriptionInput;
  onChange: (value: JobDescriptionInput) => void;
}) {
  const update = (patch: Partial<JobDescriptionInput>) => onChange({ ...value, ...patch });

  return (
    <div>
      <h3 className="text-base font-bold text-navy-900">Job Description Generator</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Job title">{textInput(value.jobTitle, (jobTitle) => update({ jobTitle }), "People Operations Manager")}</Field>
        <Field label="Department">{selectInput(value.department, (department) => update({ department }), departments)}</Field>
        <Field label="Seniority">{selectInput(value.level, (level) => update({ level }), levels)}</Field>
        <Field label="Country">{selectInput(value.country, (country) => update({ country }), countries)}</Field>
        <div className="sm:col-span-2">
          <Field label="Key responsibilities">
            {textareaInput(value.responsibilities, (responsibilities) => update({ responsibilities }), "One responsibility per line")}
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Required skills">{textareaInput(value.skills, (skills) => update({ skills }), "One skill per line")}</Field>
        </div>
      </div>
    </div>
  );
}

function OfferLetterForm({
  value,
  onChange,
}: {
  value: OfferLetterInput;
  onChange: (value: OfferLetterInput) => void;
}) {
  const update = (patch: Partial<OfferLetterInput>) => onChange({ ...value, ...patch });

  return (
    <div>
      <h3 className="text-base font-bold text-navy-900">Offer Letter Generator</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Candidate name">{textInput(value.candidateName, (candidateName) => update({ candidateName }), "Amina Okafor")}</Field>
        <Field label="Job title">{textInput(value.jobTitle, (jobTitle) => update({ jobTitle }), "People Operations Manager")}</Field>
        <Field label="Department">{textInput(value.department, (department) => update({ department }), "People")}</Field>
        <Field label="Start date">{textInput(value.startDate, (startDate) => update({ startDate }), "1 February 2026")}</Field>
        <Field label="Compensation">{textInput(value.compensation, (compensation) => update({ compensation }), "NGN 18,000,000 per year")}</Field>
        <Field label="Country">{selectInput(value.country, (country) => update({ country }), countries)}</Field>
        <Field label="Reports to">{textInput(value.reportingTo, (reportingTo) => update({ reportingTo }), "Head of Operations")}</Field>
        <Field label="Work arrangement">
          {selectInput(value.workArrangement, (workArrangement) => update({ workArrangement }), ["Office", "Remote", "Hybrid"])}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Benefits">{textareaInput(value.benefits, (benefits) => update({ benefits }), "One benefit per line")}</Field>
        </div>
      </div>
    </div>
  );
}
