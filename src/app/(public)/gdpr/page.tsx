import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "GDPR | Atlas HR",
  description:
    "How Atlas HR supports GDPR compliance — roles, data subject rights, subprocessors, international transfers, and data protection measures.",
};

const CONTACT_EMAIL = "privacy@atlashr.xyz";
const LAST_UPDATED = "July 1, 2026";

const sections = [
  {
    heading: "1. Our commitment to GDPR",
    paragraphs: [
      "The General Data Protection Regulation (GDPR) sets a high standard for how personal data of individuals in the European Economic Area (EEA) and the United Kingdom is handled. Atlas HR is built with data protection in mind and supports our customers in meeting their GDPR obligations.",
    ],
  },
  {
    heading: "2. Controller and processor roles",
    paragraphs: [
      "For personal data our customers upload about their employees and candidates, the customer is the data controller and Atlas HR acts as a data processor, processing that data only on documented instructions. For our own website visitors and account holders, Atlas HR is the controller.",
    ],
  },
  {
    heading: "3. Data Processing Agreement",
    paragraphs: [
      "We make a Data Processing Agreement (DPA) available to customers, incorporating the commitments required under Article 28 of the GDPR, including confidentiality, security, subprocessor terms, assistance with data subject requests, and deletion or return of personal data at the end of the engagement.",
    ],
  },
  {
    heading: "4. Data subject rights",
    paragraphs: [
      "The GDPR grants individuals rights to access, rectify, erase, restrict, and port their personal data, and to object to certain processing. Atlas HR provides tools and support to help controllers respond to these requests. If you are an employee of an Atlas HR customer, please direct your request to your employer as the controller, and we will assist them.",
    ],
  },
  {
    heading: "5. Lawful basis and consent",
    paragraphs: [
      "Controllers are responsible for establishing a lawful basis for processing personal data in Atlas HR. Where consent is the basis (for example, certain marketing communications), we provide mechanisms to capture and withdraw consent.",
    ],
  },
  {
    heading: "6. Subprocessors",
    paragraphs: [
      "We engage a limited set of subprocessors (such as hosting, authentication, and payment providers) to deliver the Services. We impose data protection obligations on subprocessors consistent with the GDPR and maintain a list of subprocessors available to customers on request.",
    ],
  },
  {
    heading: "7. International data transfers",
    paragraphs: [
      "Where personal data is transferred outside the EEA or the UK, we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses and the UK International Data Transfer Addendum, together with supplementary measures where required.",
    ],
  },
  {
    heading: "8. Security measures",
    paragraphs: [
      "We implement technical and organizational measures appropriate to the risk, including role-based access control, row-level security for organization data, audit logging, encryption in transit, and access separation for service roles.",
    ],
  },
  {
    heading: "9. Data breach notification",
    paragraphs: [
      "In the event of a personal data breach affecting Customer Data, we will notify affected customers without undue delay and provide information reasonably necessary to help them meet their own notification obligations.",
    ],
  },
  {
    heading: "10. Data retention and deletion",
    paragraphs: [
      "We retain personal data only as long as necessary for the purposes for which it is processed or as required by law. Customers can request export or deletion of their workspace data, and we delete or return personal data upon termination in accordance with the DPA.",
    ],
  },
  {
    heading: "11. Contact our data protection team",
    paragraphs: [
      `For GDPR-related questions, DPA requests, or to exercise data protection rights, contact us at ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function GdprPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            GDPR
          </h1>
          <p className="mt-4 text-sm text-navy-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-10">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-600">
              Looking for more on our security and privacy posture? Visit the{" "}
              <Link href="/trust" className="font-semibold text-blue-700 hover:text-blue-800">
                Trust Center
              </Link>{" "}
              or read our{" "}
              <Link href="/privacy" className="font-semibold text-blue-700 hover:text-blue-800">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
