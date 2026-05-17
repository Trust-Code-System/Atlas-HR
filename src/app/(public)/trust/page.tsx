import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Trust Center | Atlas HR",
  description:
    "Atlas HR trust center covering security, privacy, AI data use, auditability, compliance posture, and responsible HR guidance.",
};

const trustPillars = [
  {
    title: "Employee data protection",
    body: "Atlas HR is designed around workspace membership, role-based permissions, service-role separation, and secure handling of employee records, documents, leave, payroll, performance, and case data.",
  },
  {
    title: "AI with human review",
    body: "Atlas AI assists with HR drafting, research, compliance review, and workflow guidance. It should not replace qualified HR, legal, payroll, tax, or employment counsel for high-risk decisions.",
  },
  {
    title: "Audit-ready workflows",
    body: "The platform includes audit log foundations, workflow records, approval states, document history, and admin controls so HR decisions can be reviewed later.",
  },
  {
    title: "Regional compliance awareness",
    body: "Atlas HR supports country-aware content and workflows for Nigeria, India, the UK, and the US, with review notes and counsel checkpoints where local rules matter.",
  },
];

const controls = [
  "Authentication through Supabase Auth",
  "Role-based workspace access",
  "Row-level security policies for org data",
  "Audit logs for admin-sensitive activity",
  "Webhook signature verification for payments",
  "Cookie consent and privacy controls",
  "Document retention and deletion foundations",
  "AI legal-review warnings for high-risk answers",
];

const roadmap = [
  "Published subprocessor register with regions and purposes",
  "SOC 2 readiness evidence pack",
  "Customer-facing data export and deletion request workflow",
  "AI prompt/data retention disclosure by feature",
  "Security questionnaire download for procurement",
  "Incident status and breach communication runbook",
];

export default function TrustPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Atlas HR Trust Center
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              Security, privacy, and AI boundaries for HR teams.
            </h1>
            <p className="mt-6 text-base leading-8 text-navy-200 sm:text-lg">
              HR systems hold sensitive employee data. Atlas HR treats access control,
              auditability, privacy, responsible AI, and regional compliance as core
              product requirements rather than procurement afterthoughts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up?intent=trust-review"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Start a secure workspace
              </Link>
              <Link
                href="mailto:security@atlashr.com"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Contact security
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {trustPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-navy-950">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Current controls
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
              What Atlas HR already has in place.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              These controls are product and codebase foundations. Formal security
              certifications, legal review, and procurement documents should be completed
              before enterprise launch.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {controls.map((control) => (
              <div key={control} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-navy-800">
                {control}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-navy-950 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              Responsible AI
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Atlas AI is an assistant, not the final decision maker.
            </h2>
            <p className="mt-4 text-sm leading-7 text-navy-300">
              AI output can be incomplete, outdated, or jurisdiction-sensitive. Atlas HR
              should keep human approval, source review, and legal escalation visible in
              document generation, compliance answers, employee relations, and termination
              workflows.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Trust roadmap
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-950">
              What to finish before serious enterprise selling.
            </h2>
            <ul className="mt-6 space-y-3">
              {roadmap.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
