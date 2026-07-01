import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARISON_PAGES, getComparisonPage } from "@/lib/public-resource-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export function generateStaticParams() {
  return COMPARISON_PAGES.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = getComparisonPage(slug);
  if (!comparison) return {};
  return {
    title: `${comparison.title} | Atlas HR`,
    description: comparison.summary,
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = getComparisonPage(slug);
  if (!comparison) notFound();
  const faqs = buildFaqs(comparison);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-slate-50 text-navy-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Comparison</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold sm:text-5xl">{comparison.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-navy-200">{comparison.summary}</p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <ListCard title="What they do well" items={comparison.competitorStrengths} />
            <ListCard title="Where Atlas can win" items={comparison.atlasAdvantages} highlight />
            <ListCard title="Gaps to close" items={comparison.gapsToClose} />
          </div>
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-950">Positioning</h2>
            <p className="mt-3 text-sm leading-6 text-blue-900">{comparison.cta}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/templates" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
                Browse templates
              </Link>
              <Link href="/countries" className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                See country hubs
              </Link>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-navy-900">FAQ</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {faqs.map((faq) => (
                <article key={faq.question}>
                  <h3 className="text-sm font-bold text-navy-900">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function ListCard({ title, items, highlight = false }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <section className={`rounded-xl border p-6 ${highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
      <h2 className="text-xl font-bold text-navy-900">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  );
}

function buildFaqs(comparison: NonNullable<ReturnType<typeof getComparisonPage>>) {
  return [
    {
      question: `What is the main difference in ${comparison.title}?`,
      answer: comparison.summary,
    },
    {
      question: "Where does Atlas HR have an advantage?",
      answer: comparison.atlasAdvantages.join(". "),
    },
    {
      question: "What should buyers still evaluate?",
      answer: comparison.gapsToClose.join(". "),
    },
  ];
}
