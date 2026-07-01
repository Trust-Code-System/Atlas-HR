import type { Metadata } from "next";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Privacy Policy | Atlas HR",
  description:
    "How Atlas HR collects, uses, stores, and protects personal data across our platform and website.",
};

const CONTACT_EMAIL = "hello@trustcodesystem.tech";
const LAST_UPDATED = "July 1, 2026";

const sections = [
  {
    heading: "1. Overview",
    paragraphs: [
      "This Privacy Policy explains how Atlas HR (\"Atlas HR\", \"we\", \"us\", or \"our\") collects, uses, discloses, and safeguards information when you use our website and HR platform (the \"Services\").",
      "Atlas HR is an HR platform, which means we often process personal data about our customers' employees on their behalf. In that context our customer is the data controller and Atlas HR acts as a data processor. For our website and account data, Atlas HR is the controller.",
    ],
  },
  {
    heading: "2. Information we collect",
    paragraphs: [
      "Account and contact information: name, work email, company, role, and billing details you provide when you create an account or contact us.",
      "Employee and HR data: records our customers upload or generate in the platform, such as employee profiles, documents, leave, payroll references, performance notes, and case data.",
      "Usage and device data: log data, IP address, browser type, pages viewed, and similar information collected automatically to operate and improve the Services.",
      "Cookies and similar technologies used to keep you signed in, remember preferences, and understand how the Services are used.",
    ],
  },
  {
    heading: "3. How we use information",
    paragraphs: [
      "To provide, maintain, secure, and improve the Services; to authenticate users and manage access; to process payments; to respond to support requests; to send service and, where permitted, marketing communications; and to comply with legal obligations.",
      "Atlas AI features may process content you submit to generate drafts, research, and compliance guidance. AI output is assistive and subject to human review; we do not use customer HR data to train third-party foundation models without a lawful basis and appropriate controls.",
    ],
  },
  {
    heading: "4. Legal bases for processing",
    paragraphs: [
      "Where applicable law (such as the GDPR) requires it, we rely on one or more of the following legal bases: performance of a contract, our legitimate interests, your consent, and compliance with legal obligations.",
    ],
  },
  {
    heading: "5. Sharing and disclosure",
    paragraphs: [
      "We share information with service providers (subprocessors) who help us run the Services — for example hosting, authentication, payments, and analytics — under contracts that require appropriate safeguards.",
      "We may disclose information to comply with law, enforce our agreements, protect rights and safety, or in connection with a merger, acquisition, or asset sale. We do not sell personal data.",
    ],
  },
  {
    heading: "6. International transfers",
    paragraphs: [
      "Your information may be processed in countries other than your own. Where we transfer personal data internationally, we use appropriate safeguards such as Standard Contractual Clauses.",
    ],
  },
  {
    heading: "7. Data retention",
    paragraphs: [
      "We retain personal data for as long as needed to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. Customers can request export or deletion of workspace data as described in our documentation.",
    ],
  },
  {
    heading: "8. Security",
    paragraphs: [
      "We use technical and organizational measures including role-based access controls, row-level security for organization data, audit logging, and encryption in transit. No method of transmission or storage is completely secure, but we work to protect your information.",
    ],
  },
  {
    heading: "9. Your rights",
    paragraphs: [
      "Depending on your location, you may have rights to access, correct, delete, restrict, or object to the processing of your personal data, and to data portability. To exercise these rights, contact us using the details below. If your data is held by an Atlas HR customer as controller, we will refer your request to them.",
    ],
  },
  {
    heading: "10. Children's privacy",
    paragraphs: [
      "The Services are intended for business use and are not directed to children. We do not knowingly collect personal data from children.",
    ],
  },
  {
    heading: "11. Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. When we make material changes, we will update the \"Last updated\" date and, where appropriate, provide additional notice.",
    ],
  },
  {
    heading: "12. Contact us",
    paragraphs: [
      `If you have questions about this Privacy Policy or our data practices, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-navy-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-10">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            This document is a general template and does not constitute legal
            advice. Please have it reviewed by qualified counsel before relying
            on it for your business.
          </p>
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-2xl font-bold tracking-tight text-navy-950">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-base leading-7 text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
