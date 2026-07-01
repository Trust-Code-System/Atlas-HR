import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

// Public var read directly (avoids pulling server-env validation into render).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Only the unique legal documents are routed here. `/privacy` and `/terms`
// remain their own canonical rendered pages, so those slugs are intentionally
// excluded to avoid duplicate policies.
const LEGAL_SLUGS = ["cookies", "dpa", "acceptable-use"] as const;
type LegalSlug = (typeof LEGAL_SLUGS)[number];

const legalDir = path.join(process.cwd(), "src/content/legal");

type LegalDoc = { title: string; slug: string; lastUpdated?: string; content: string };

const legalNav = [
  { href: "/privacy", label: "Privacy Policy", description: "How Atlas HR handles personal data" },
  { href: "/terms", label: "Terms of Service", description: "Commercial and product terms" },
  { href: "/legal/dpa", label: "Data Processing Addendum", description: "Controller and processor obligations" },
  { href: "/legal/cookies", label: "Cookie Policy", description: "Essential and optional cookies" },
  { href: "/legal/acceptable-use", label: "Acceptable Use", description: "Rules for safe platform use" },
];

const docSummaries: Record<LegalSlug, string> = {
  cookies:
    "How Atlas HR uses essential, functional, analytics, and third-party cookies while keeping optional tracking consent-based.",
  dpa:
    "How Atlas HR processes customer personal data as a processor, including security measures, subprocessors, transfers, and customer obligations.",
  "acceptable-use":
    "The conduct, content, automation, security, and HR-specific restrictions that keep Atlas HR safe for customers.",
};

function getLegalDoc(slug: string): LegalDoc | null {
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return null;
  const filePath = path.join(legalDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return {
    title: typeof data.title === "string" ? data.title : slug,
    slug,
    lastUpdated: typeof data.lastUpdated === "string" ? data.lastUpdated : undefined,
    content,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

const legalComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className="mt-10 scroll-mt-28 text-2xl font-bold tracking-tight text-navy-950 first:mt-0" />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="mt-7 text-lg font-bold text-navy-900" />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="mt-3 text-base leading-8 text-slate-700" />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="mt-4 space-y-2 pl-5 text-base leading-8 text-slate-700" />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="mt-4 list-decimal space-y-2 pl-5 text-base leading-8 text-slate-700" />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="pl-1 marker:text-blue-600" />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900" />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className="font-bold text-navy-950" />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table {...props} className="min-w-full text-left text-sm" />
      </div>
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} className="bg-slate-50 text-navy-950" />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600" />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props} className="divide-y divide-slate-100 bg-white" />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className="px-4 py-4 align-top text-sm leading-6 text-slate-700" />
  ),
};

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | Atlas HR`,
    description: `${doc.title} for Atlas HR — how we handle your data and use of the service.`,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const canonical = `${SITE_URL}/legal/${slug}`;
  const summary = docSummaries[doc.slug as LegalSlug];
  const updatedLabel = doc.lastUpdated ? formatDate(doc.lastUpdated) : "Available on request";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: doc.title, item: canonical },
    ],
  };

  return (
    <div className="text-navy-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <PublicHeroBg />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Legal</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">{doc.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-navy-200 sm:text-lg">{summary}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-300">Document status</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-navy-300">Last updated</dt>
                <dd className="font-semibold text-white">{updatedLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-navy-300">Version</dt>
                <dd className="font-semibold text-white">Current</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-navy-300">Questions</dt>
                <dd>
                  <a className="font-semibold text-blue-200 hover:text-white" href="mailto:legal@atlashr.xyz">
                    legal@atlashr.xyz
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-public-content px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Legal documents</p>
              <nav className="mt-4 space-y-2" aria-label="Legal documents">
                {legalNav.map((item) => {
                  const active = item.href === `/legal/${slug}`;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-xl border px-4 py-3 transition ${
                        active
                          ? "border-blue-200 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-navy-950">Need a signed copy?</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enterprise customers can request legal and procurement documents by email.
              </p>
              <a
                href="mailto:legal@atlashr.xyz?subject=Legal%20document%20request"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Contact legal
              </a>
            </div>
          </aside>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-white px-3 py-1 text-blue-700 ring-1 ring-blue-100">Atlas HR legal</span>
                <span>Last updated {updatedLabel}</span>
              </div>
            </div>
            <div className="px-6 py-8 sm:px-8 lg:px-10">
              <MDXRemote
                source={doc.content}
                components={legalComponents}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
