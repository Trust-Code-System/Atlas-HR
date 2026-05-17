import Link from "next/link";
import { getAllKnowledgeArticles } from "@/lib/knowledge";
import { CATEGORY_LABELS } from "@/lib/knowledge-shared";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Knowledge Hub | Atlas HR" };

const CATEGORY_ICONS: Record<string, string> = {
  hiring:       "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  onboarding:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  performance:  "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  compliance:   "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  leave:        "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  compensation: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  offboarding:  "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  default:      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
};

export default function AppKnowledgeHubPage() {
  const articles = getAllKnowledgeArticles();
  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Hub</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                Practical HR guidance · {articles.length} guides across {categories.length} categories
              </p>
            </div>
          </div>
          <Link href="/copilot"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask Atlas AI
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            value: articles.length.toString(),
            label: "Guides",
            strip: "from-blue-400 to-blue-600",
            grad:  "from-blue-500 to-blue-700",
            icon:  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
          },
          {
            value: categories.length.toString(),
            label: "Categories",
            strip: "from-violet-400 to-purple-500",
            grad:  "from-violet-500 to-purple-600",
            icon:  "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
          },
          {
            value: "US, UK, NG, IN",
            label: "Country-aware coverage",
            strip: "from-emerald-400 to-teal-500",
            grad:  "from-emerald-500 to-teal-600",
            icon:  "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            mono:  true,
          },
        ].map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className={`${k.mono ? "text-xl" : "font-mono text-3xl"} font-semibold leading-none tracking-tight text-navy-950 tabular-nums`}>{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-navy-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-4">Categories</h2>
          <div className="space-y-1">
            {categories.map((category) => {
              const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.default;
              const count = articles.filter((a) => a.category === category).length;
              return (
                <a key={category} href={`#${category}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-blue-50 hover:text-blue-700 group"
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-navy-400 group-hover:text-blue-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="font-mono text-xs text-navy-400 shrink-0 ml-2">{count}</span>
                </a>
              );
            })}
          </div>
        </aside>

        {/* Articles */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryArticles = articles.filter((a) => a.category === category);
            if (!categoryArticles.length) return null;
            const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.default;

            return (
              <section key={category} id={category} className="scroll-mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-navy-900">{CATEGORY_LABELS[category]}</h2>
                    <p className="text-xs text-navy-400">{categoryArticles.length} guide{categoryArticles.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryArticles.slice(0, 8).map((article) => (
                    <Link
                      key={`${article.category}/${article.slug}`}
                      href={`/knowledge-hub/${article.slug}`}
                      className="block rounded-2xl border border-navy-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md group"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                          {article.readingTime} min read
                        </span>
                        <span className="text-xs text-navy-400">{article.publishedAt || "Atlas HR"}</span>
                      </div>
                      <h3 className="text-sm font-bold leading-snug text-navy-900 group-hover:text-blue-700 transition-colors">{article.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-navy-500">
                        {article.excerpt || "Practical HR guidance from Atlas HR."}
                      </p>
                      {article.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-navy-100 px-2 py-1 text-xs text-navy-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
