import Link from "next/link";
import { getAllKnowledgeArticles } from "@/lib/knowledge";
import { CATEGORY_LABELS } from "@/lib/knowledge-shared";
import { TRUST_SIGNALS } from "@/lib/public-resource-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata = {
  title: "HR Knowledge Hub | Atlas HR",
  description:
    "Practical HR guides for recruitment, compliance, leave, payroll, performance, policies, onboarding, discipline, and employee relations.",
};

export default function PublicKnowledgePage() {
  const articles = getAllKnowledgeArticles();
  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Knowledge hub</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            HR guidance that connects to templates, tools, and real workflows.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Use Atlas HR articles as the starting point for country-aware documents, compliance review, manager support, and employee lifecycle decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/templates" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              Browse templates
            </Link>
            <Link href="/workflows" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              View workflows
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Categories</h2>
            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <a
                  key={category}
                  href={`#${category}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {articles.filter((article) => article.category === category).length}
                  </span>
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric value={articles.length.toString()} label="public HR guides" />
              <Metric value={categories.length.toString()} label="core categories" />
              <Metric value="US, UK, NG, IN" label="country-aware coverage" />
            </div>

            {categories.map((category) => {
              const categoryArticles = articles.filter((article) => article.category === category);
              if (!categoryArticles.length) return null;

              return (
                <section key={category} id={category} className="scroll-mt-24">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-navy-900">{CATEGORY_LABELS[category]}</h2>
                      <p className="mt-1 text-sm text-slate-500">{categoryArticles.length} practical guides</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categoryArticles.slice(0, 9).map((article) => (
                      <Link key={`${article.category}/${article.slug}`} href={`/knowledge/${article.slug}`} id={article.slug} className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm hover:border-blue-200 transition-all group">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {article.readingTime} min read
                          </span>
                          <span className="text-xs text-slate-400">{article.publishedAt || "Atlas HR"}</span>
                        </div>
                        <h3 className="text-base font-bold leading-snug text-navy-900 group-hover:text-blue-700 transition-colors">{article.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{article.excerpt || "Practical HR guidance from Atlas HR."}</p>
                        {article.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-3 text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">Read article →</p>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            <TrustPanel />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-mono text-2xl font-bold text-navy-900">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function TrustPanel() {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-bold text-amber-950">Trust and review notes</h2>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-amber-900 md:grid-cols-3">
        <p>{TRUST_SIGNALS.disclaimer}</p>
        <p>{TRUST_SIGNALS.legalReviewStatus}</p>
        <p>{TRUST_SIGNALS.sourceNote}</p>
      </div>
    </section>
  );
}
