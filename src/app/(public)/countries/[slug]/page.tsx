import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { TEMPLATES } from "@/lib/templates-data";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { COUNTRY_HUBS, getCountryHub } from "@/lib/public-resource-data";
import { getCountryGuide } from "@/lib/mdx";
import { COUNTRY_MDX_COMPONENTS } from "@/components/mdx/country-mdx-components";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";
import type { TocHeading } from "@/lib/mdx";

// Public var read directly (avoids pulling server-env validation into render).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Map app slugs (nigeria/india/uk/us) to MDX file slugs
const MDX_SLUG_MAP: Record<string, string> = {
  nigeria: "nigeria",
  india: "india",
  uk: "united-kingdom",
  us: "united-states",
};

// Official regulators and sources per country
const COUNTRY_REGULATORS: Record<string, { name: string; url: string; note: string }[]> = {
  nigeria: [
    { name: "Nigeria Labour Act", url: "https://nelex.gov.ng/documents/LABOUR_ACT.pdf", note: "Core statute for covered workers" },
    { name: "National Pension Commission", url: "https://www.pencom.gov.ng/", note: "Pension registration, RSA, contribution rules" },
    { name: "NSITF", url: "https://nsitf.gov.ng/", note: "Employees' compensation scheme contributions" },
    { name: "Ministry of Labour & Employment", url: "https://labour.gov.ng/", note: "Policy, permits, workplace inspections" },
    { name: "Federal Inland Revenue Service", url: "https://www.firs.gov.ng/", note: "PAYE, tax registration, ITF" },
    { name: "National Industrial Court", url: "https://nicn.gov.ng/", note: "Primary employment dispute forum" },
  ],
  india: [
    { name: "Ministry of Labour & Employment", url: "https://labour.gov.in/", note: "Labour codes, PF, ESI, factories" },
    { name: "EPFO – Provident Fund", url: "https://www.epfindia.gov.in/", note: "PF registration, UAN, contributions" },
    { name: "ESIC", url: "https://www.esic.in/", note: "Employees' state insurance compliance" },
    { name: "Income Tax Department", url: "https://www.incometax.gov.in/", note: "TDS deduction, Form 16, payroll tax" },
    { name: "Shram Suvidha Portal", url: "https://shramsuvidha.gov.in/", note: "Unified labour law compliance filing" },
  ],
  uk: [
    { name: "GOV.UK – Employing People", url: "https://www.gov.uk/browse/employing-people", note: "Statutory guidance from BEIS/HMRC" },
    { name: "ACAS", url: "https://www.acas.org.uk/", note: "Codes of practice, early conciliation, guidance" },
    { name: "HMRC – PAYE for Employers", url: "https://www.gov.uk/paye-for-employers", note: "PAYE, NIC, Real Time Information" },
    { name: "The Pensions Regulator", url: "https://www.thepensionsregulator.gov.uk/", note: "Auto-enrolment, workplace pension duties" },
    { name: "Health & Safety Executive", url: "https://www.hse.gov.uk/", note: "Workplace health and safety law" },
    { name: "Equality & Human Rights Commission", url: "https://www.equalityhumanrights.com/", note: "Equality Act 2010, protected characteristics" },
  ],
  us: [
    { name: "US Department of Labor", url: "https://www.dol.gov/", note: "FLSA, FMLA, OSHA, benefits, wage rules" },
    { name: "EEOC", url: "https://www.eeoc.gov/", note: "Anti-discrimination law and enforcement" },
    { name: "IRS – Employer Tax Guide", url: "https://www.irs.gov/businesses/small-businesses-self-employed/employers", note: "Payroll taxes, W-2, withholding" },
    { name: "OSHA", url: "https://www.osha.gov/", note: "Workplace safety standards and inspections" },
    { name: "National Labor Relations Board", url: "https://www.nlrb.gov/", note: "Union rights, collective bargaining" },
    { name: "HHS / HIPAA", url: "https://www.hhs.gov/hipaa/", note: "Health data privacy for employers" },
  ],
};

export function generateStaticParams() {
  return COUNTRY_HUBS.map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryHub(slug);
  if (!country) return {};
  return {
    title: `${country.name} HR Country Hub | Atlas HR`,
    description: country.summary,
    alternates: { canonical: `/countries/${slug}` },
  };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = getCountryHub(slug);
  if (!country) notFound();

  const mdxSlug = MDX_SLUG_MAP[slug] ?? slug;
  const guide = getCountryGuide(mdxSlug);

  const templates = country.templateSlugs
    .map((s) => TEMPLATES.find((t) => t.slug === s || t.aliases?.includes(s)))
    .filter(Boolean);
  const tools = country.toolSlugs
    .map((s) => TOOLS_CONFIG.find((t) => t.slug === s))
    .filter(Boolean);

  const regulators = COUNTRY_REGULATORS[slug] ?? [];

  // Breadcrumb structured data (SEO). Static/trusted content — safe to inline.
  const canonical = `${SITE_URL}/countries/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries", item: `${SITE_URL}/countries` },
      { "@type": "ListItem", position: 3, name: `${country.name} HR Country Hub`, item: canonical },
    ],
  };

  return (
    <div className="bg-slate-50 text-navy-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/countries" className="text-sm font-semibold text-blue-300 hover:text-blue-100 transition-colors">
            ← Countries
          </Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-5xl">{country.headline}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-navy-200">{country.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-100">
              {country.variant.toUpperCase()} localised templates
            </span>
            {guide && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {guide.readingTime} min read
              </span>
            )}
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              Updated {country.lastUpdated}
            </span>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-100">
              {country.legalReviewStatus}
            </span>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">

          {/* ── Main content ── */}
          <main className="min-w-0 space-y-8">
            {/* Quick-reference grid */}
            <QuickRefGrid country={country} />

            {/* Full MDX guide */}
            {guide ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-10">
                <MDXRemote
                  source={guide.content}
                  components={COUNTRY_MDX_COMPONENTS}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Full guide content coming soon.</p>
              </div>
            )}

            {/* When to call counsel */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-bold text-amber-950">When to call counsel</h2>
              <ul className="mt-3 space-y-2">
                {country.whenToCallCounsel.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-amber-900">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </main>

          {/* ── Sidebar ── */}
          <aside className="mt-8 space-y-5 lg:mt-0">
            <div className="lg:sticky lg:top-6 space-y-5">
              {/* Table of contents */}
              {guide && guide.headings.length > 0 && (
                <TableOfContents headings={guide.headings} />
              )}

              {/* Templates */}
              {templates.length > 0 && (
                <ResourceBox title="Localised templates">
                  {templates.map((t) => (
                    <Link
                      key={t!.slug}
                      href={`/templates#${t!.slug}`}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy-800 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t!.name}
                    </Link>
                  ))}
                </ResourceBox>
              )}

              {/* Tools */}
              {tools.length > 0 && (
                <ResourceBox title="Related tools">
                  {tools.map((t) => (
                    <Link
                      key={t!.slug}
                      href={`/tools#${t!.slug}`}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy-800 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {t!.name}
                    </Link>
                  ))}
                </ResourceBox>
              )}

              {/* Regulators & official sources */}
              {regulators.length > 0 && (
                <ResourceBox title="Official regulators & sources">
                  {regulators.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-navy-800 leading-tight">{r.name}</span>
                        <svg className="h-3.5 w-3.5 text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{r.note}</p>
                    </a>
                  ))}
                  <p className="text-[10px] text-slate-400 px-1 pt-1">
                    Always verify current figures with official sources before acting.
                  </p>
                </ResourceBox>
              )}

              {/* Source note */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Source note</p>
                <p className="text-xs text-slate-600 leading-relaxed">{country.sourceNote}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

// ─── Quick reference grid ─────────────────────────────────────────────────────

function QuickRefGrid({ country }: { country: ReturnType<typeof getCountryHub> }) {
  if (!country) return null;
  const sections: [string, string[]][] = [
    ["Leave", country.leave],
    ["Termination", country.termination],
    ["Contracts", country.contracts],
    ["Payroll basics", country.payroll],
    ["Probation", country.probation],
    ["Notice periods", country.noticePeriods],
    ["Required documents", country.requiredDocuments],
  ];
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Quick reference</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(([title, items]) => (
          <section key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-navy-900 text-sm mb-2">{title}</h3>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── Table of contents ────────────────────────────────────────────────────────

function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const h2s = headings.filter((h) => h.level === 2);
  if (h2s.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">In this guide</p>
      <nav className="space-y-1">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`block text-xs leading-relaxed transition-colors hover:text-blue-600 ${
              h.level === 2
                ? "font-medium text-navy-700 py-0.5"
                : "pl-3 text-slate-500 py-0.5"
            }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ─── Resource box ─────────────────────────────────────────────────────────────

function ResourceBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
