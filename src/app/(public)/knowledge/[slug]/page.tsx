import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getArticleBySlug,
  getAllArticles,
  getRelatedArticles,
  type Article,
} from "@/lib/mdx";
import { CATEGORY_LABELS } from "@/lib/knowledge-shared";
import { COUNTRY_MDX_COMPONENTS } from "@/components/mdx/country-mdx-components";
import {
  getReviewerProfile,
  COUNTRY_FLAG_MAP,
  COUNTRY_LABEL_MAP,
  LEGAL_REVIEW_CATEGORIES,
} from "@/lib/trust-data";
import { getTemplate } from "@/lib/templates-data";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Atlas HR`,
    description: article.excerpt,
  };
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const reviewer = getReviewerProfile(article.reviewedBy || article.author);
  const relatedArticles = getRelatedArticles(article.relatedArticles ?? []).slice(0, 3);
  const relatedTemplates = (article.relatedTemplates ?? [])
    .map((s) => getTemplate(s))
    .filter(Boolean)
    .slice(0, 3);
  const needsLegalReview = LEGAL_REVIEW_CATEGORIES.has(article.category);

  return (
    <div className="bg-slate-50 text-navy-900">
      {/* Hero */}
      <section className="bg-navy-900 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href="/knowledge"
              className="text-xs font-semibold text-blue-300 hover:text-blue-200 transition-colors"
            >
              ← Knowledge Hub
            </Link>
            <span className="text-navy-500 text-xs">/</span>
            <span className="text-xs text-navy-300">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-snug sm:text-4xl">{article.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-navy-200">{article.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
              {article.readingTime} min read
            </span>
            {article.countries?.map((c) => (
              <span key={c} className="flex items-center gap-1.5 font-semibold text-navy-200">
                <svg className="h-3 w-3 text-blue-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                {COUNTRY_LABEL_MAP[c.toLowerCase()] ?? c}
              </span>
            ))}
            {needsLegalReview && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 font-semibold text-amber-200">
                Legal review recommended
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Content + sidebar */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
          {/* Article body */}
          <div>
            <div className="prose prose-slate max-w-none prose-headings:text-navy-900 prose-headings:font-bold prose-p:leading-7 prose-li:leading-7 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-navy-900">
              <MDXRemote source={article.content} components={COUNTRY_MDX_COMPONENTS} />
            </div>

            {/* Trust / Author panel */}
            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Author */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${reviewer.color} text-white font-bold text-base`}>
                    {reviewer.initials}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">Written by</p>
                    <p className="font-bold text-navy-900 text-sm">{article.author}</p>
                    <p className="text-xs text-slate-500">{reviewer.role}</p>
                  </div>
                </div>

                {/* Reviewer */}
                {article.reviewedBy && article.reviewedBy !== article.author && (
                  <div className="flex items-start gap-4 flex-1 sm:border-l sm:border-slate-100 sm:pl-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-base`}>
                      {article.reviewedBy.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">Reviewed by</p>
                      <p className="font-bold text-navy-900 text-sm">{article.reviewedBy}</p>
                      {article.reviewedAt && (
                        <p className="text-xs text-slate-500">Verified {article.reviewedAt}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex flex-col gap-1 text-xs text-slate-400 sm:text-right shrink-0">
                  <span>Published {article.publishedAt}</span>
                  {article.updatedAt && article.updatedAt !== article.publishedAt && (
                    <span>Updated {article.updatedAt}</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="mt-4 text-sm leading-6 text-slate-600 border-t border-slate-100 pt-4">
                {reviewer.bio}
              </p>

              {/* Specialisms */}
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewer.specialisms.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-semibold text-amber-800">
                Atlas HR articles are practical HR guidance, not legal advice. For high-risk decisions — dismissal, redundancy, discrimination, statutory entitlements — seek qualified legal counsel in the relevant jurisdiction.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="mt-8 space-y-5 lg:mt-0">
            <div className="lg:sticky lg:top-6 space-y-5">
              {/* Verification card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Editorial standards</h2>
                <div className="space-y-3">
                  <TrustRow icon="author"   label="Author"       value={article.author} />
                  <TrustRow icon="check"    label="Reviewed by"  value={article.reviewedBy || "Atlas HR Editorial Team"} />
                  {article.reviewedAt && (
                    <TrustRow icon="calendar" label="Last verified" value={article.reviewedAt} />
                  )}
                  <TrustRow icon="refresh"  label="Last updated"  value={article.updatedAt ?? article.publishedAt} />
                  <TrustRow
                    icon="globe"
                    label="Applies to"
                    value={(article.countries ?? ["global"])
                      .map((c) => COUNTRY_LABEL_MAP[c.toLowerCase()] ?? c)
                      .join(", ")}
                  />
                </div>
                {needsLegalReview && (
                  <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-amber-800">
                      This topic involves legal obligations. Confirm details with local counsel before acting.
                    </p>
                  </div>
                )}
              </div>

              {/* Related templates */}
              {relatedTemplates.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Related templates</h2>
                  <div className="space-y-2">
                    {relatedTemplates.map((t) => t && (
                      <Link
                        key={t.slug}
                        href={`/templates#${t.slug}`}
                        className="flex items-start gap-2.5 group"
                      >
                        <div className="mt-0.5 h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {t.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related articles */}
              {relatedArticles.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Related articles</h2>
                  <div className="space-y-3">
                    {relatedArticles.map((a) => (
                      <Link
                        key={a.slug}
                        href={`/knowledge/${a.slug}`}
                        className="block group"
                      >
                        <p className="text-sm font-semibold text-navy-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {a.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.readingTime} min read</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

const TRUST_ICON_PATHS: Record<string, string> = {
  author:   "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  check:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  refresh:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  globe:    "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
};

function TrustRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const path = TRUST_ICON_PATHS[icon] ?? TRUST_ICON_PATHS.globe;
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-700 leading-snug mt-0.5">{value}</p>
      </div>
    </div>
  );
}
