import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticleBySlug } from "@/lib/mdx";
import { CATEGORY_LABELS } from "@/lib/knowledge-shared";
import { COUNTRY_MDX_COMPONENTS } from "@/components/mdx/country-mdx-components";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return {
    title: article?.title ?? "Knowledge Hub",
    description: article?.excerpt,
  };
}

export default async function AppKnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-3">
            <Link href="/knowledge-hub" className="hover:text-white transition-colors">Knowledge Hub</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-300 truncate">{article.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-snug mb-2">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30">
              {CATEGORY_LABELS[article.category] ?? article.category}
            </span>
            <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-blue-200 ring-1 ring-white/10">
              {article.readingTime} min read
            </span>
            {article.publishedAt && (
              <span className="font-mono text-xs text-blue-400">{article.publishedAt}</span>
            )}
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-navy-200 bg-white p-6 shadow-sm">
        {article.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-navy-100 px-2.5 py-1 text-xs text-navy-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {article.excerpt && (
          <p className="text-base leading-7 text-navy-600 mb-8 pb-8 border-b border-navy-100">
            {article.excerpt}
          </p>
        )}

        <div className="prose prose-slate max-w-none prose-headings:text-navy-900 prose-headings:font-bold prose-p:leading-7 prose-li:leading-7 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-navy-900">
          <MDXRemote source={article.content} components={COUNTRY_MDX_COMPONENTS} />
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-bold text-navy-900">Use this with Atlas AI</h2>
          <p className="mt-2 text-sm leading-6 text-navy-600">
            Ask Atlas AI to turn this guidance into a checklist, policy draft, manager script, or country-aware action plan.
          </p>
          <Link
            href="/copilot"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Ask Atlas AI
          </Link>
        </div>
      </article>
    </div>
  );
}
