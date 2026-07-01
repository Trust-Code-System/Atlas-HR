import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

// Public var read directly (avoids pulling server-env validation into render).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Only the unique legal documents are routed here. `/privacy` and `/terms`
// remain their own canonical rendered pages, so those slugs are intentionally
// excluded to avoid duplicate policies.
const LEGAL_SLUGS = ["cookies", "dpa", "acceptable-use"] as const;
type LegalSlug = (typeof LEGAL_SLUGS)[number];

const legalDir = path.join(process.cwd(), "src/content/legal");

type LegalDoc = { title: string; lastUpdated?: string; content: string };

function getLegalDoc(slug: string): LegalDoc | null {
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return null;
  const filePath = path.join(legalDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf-8"));
  return {
    title: typeof data.title === "string" ? data.title : slug,
    lastUpdated: typeof data.lastUpdated === "string" ? data.lastUpdated : undefined,
    content,
  };
}

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
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Legal</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{doc.title}</h1>
          {doc.lastUpdated && (
            <p className="mt-4 text-sm text-navy-300">Last updated: {doc.lastUpdated}</p>
          )}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="prose prose-slate mx-auto max-w-4xl prose-headings:text-navy-950 prose-headings:font-bold prose-p:leading-7 prose-li:leading-7 prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-navy-900">
          <MDXRemote source={doc.content} />
        </div>
      </section>
    </div>
  );
}
