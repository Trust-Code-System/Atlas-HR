import type { Metadata } from "next";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata: Metadata = {
  title: "Terms of Service | Atlas HR",
  description:
    "The terms and conditions that govern your use of the Atlas HR website and platform.",
};

const CONTACT_EMAIL = "legal@atlashr.xyz";
const LAST_UPDATED = "July 1, 2026";

const sections = [
  {
    heading: "1. Agreement to terms",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern your access to and use of the Atlas HR website and platform (the \"Services\") provided by Atlas HR (\"we\", \"us\", or \"our\"). By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.",
    ],
  },
  {
    heading: "2. Accounts",
    paragraphs: [
      "You must provide accurate information when creating an account and keep it up to date. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us promptly of any unauthorized use.",
    ],
  },
  {
    heading: "3. Acceptable use",
    paragraphs: [
      "You agree not to misuse the Services, including by attempting to access them without authorization, interfering with their operation, uploading unlawful or infringing content, or using them to violate the rights of others or applicable law.",
    ],
  },
  {
    heading: "4. Customer data",
    paragraphs: [
      "You retain ownership of the data you and your users submit to the Services (\"Customer Data\"). You grant us the rights necessary to host, process, and display Customer Data to provide the Services. You are responsible for having the necessary rights and lawful bases to submit Customer Data, including personal data about your employees.",
    ],
  },
  {
    heading: "5. AI features",
    paragraphs: [
      "Atlas AI provides assistive drafting, research, and compliance guidance. AI output may be incomplete, inaccurate, or jurisdiction-sensitive and is not legal, tax, payroll, or professional advice. You are responsible for reviewing AI output and obtaining qualified professional advice before acting on high-risk decisions.",
    ],
  },
  {
    heading: "6. Fees and payment",
    paragraphs: [
      "Paid plans are billed according to the pricing and billing terms presented at purchase. Fees are non-refundable except as required by law or expressly stated. We may change pricing with reasonable notice.",
    ],
  },
  {
    heading: "7. Intellectual property",
    paragraphs: [
      "The Services, including all software, content, and trademarks (excluding Customer Data), are owned by Atlas HR or its licensors and are protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable right to use the Services in accordance with these Terms.",
    ],
  },
  {
    heading: "8. Third-party services",
    paragraphs: [
      "The Services may integrate with or link to third-party products. We are not responsible for third-party services, and your use of them is governed by their own terms.",
    ],
  },
  {
    heading: "9. Disclaimers",
    paragraphs: [
      "The Services are provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement, to the maximum extent permitted by law.",
    ],
  },
  {
    heading: "10. Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Atlas HR will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits or data. Our aggregate liability arising out of or relating to the Services will not exceed the amounts you paid us in the twelve months preceding the claim.",
    ],
  },
  {
    heading: "11. Termination",
    paragraphs: [
      "You may stop using the Services at any time. We may suspend or terminate access if you breach these Terms or to protect the Services. Upon termination, your right to use the Services ends; certain provisions survive termination by their nature.",
    ],
  },
  {
    heading: "12. Changes to the Services and Terms",
    paragraphs: [
      "We may modify the Services and these Terms from time to time. When we make material changes to the Terms, we will update the \"Last updated\" date and provide notice where appropriate. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    heading: "13. Governing law",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-laws principles, except where mandatory local law applies.",
    ],
  },
  {
    heading: "14. Contact us",
    paragraphs: [
      `Questions about these Terms can be sent to ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Service
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
        </div>
      </section>
    </div>
  );
}
