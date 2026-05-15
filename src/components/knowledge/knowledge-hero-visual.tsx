import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedArticle {
  slug: string;
  title: string;
  category: string;
  excerpt?: string;
  heroImage?: string;
}

interface KnowledgeHeroVisualProps {
  articles: FeaturedArticle[];
  categoryLabel: (category: string) => string;
  articleStyle: (category: string) => { bg: string; fg: string; Icon: LucideIcon };
}

export function KnowledgeHeroVisual({
  articles,
  categoryLabel,
  articleStyle,
}: KnowledgeHeroVisualProps) {
  const [primary, ...rest] = articles;

  if (!primary) return null;

  const { bg: primaryBg, fg: primaryFg, Icon: PrimaryIcon } = articleStyle(primary.category);

  return (
    <div className="relative mx-auto w-full max-w-lg md:max-w-none">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[--accent]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-[--accent-soft] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--bg-card] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[--border] bg-[--bg-hover]/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[--danger]" />
          <span className="size-2.5 rounded-full bg-[--warning]" />
          <span className="size-2.5 rounded-full bg-[--success]" />
          <span className="ml-2 text-xs font-medium text-[--text-tertiary]">
            knowledge.atlashr.app
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <Link
            href={`/knowledge/${primary.category}/${primary.slug}`}
            className="group block overflow-hidden rounded-xl border border-[--border] bg-[--bg-app] transition-[border-color,box-shadow] hover:border-[--accent] hover:shadow-md"
          >
            {primary.heroImage ? (
              <div className="relative aspect-[16/9]">
                <Image
                  src={primary.heroImage}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 480px"
                  priority
                />
              </div>
            ) : (
              <div
                className={cn(
                  "flex aspect-[16/9] items-center justify-center",
                  primaryBg
                )}
              >
                <PrimaryIcon size={40} className={primaryFg} aria-hidden="true" />
              </div>
            )}
            <div className="p-4">
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  primaryBg,
                  primaryFg
                )}
              >
                {categoryLabel(primary.category)}
              </span>
              <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-[--text-primary] group-hover:text-[--accent]">
                {primary.title}
              </h3>
            </div>
          </Link>

          <ul className="mt-3 space-y-2">
            {rest.slice(0, 2).map((article) => {
              const { fg } = articleStyle(article.category);
              return (
                <li key={article.slug}>
                  <Link
                    href={`/knowledge/${article.category}/${article.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[--border] bg-[--bg-app] px-3 py-2.5 transition-colors hover:border-[--accent] hover:bg-[--bg-hover]"
                  >
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wide",
                          fg
                        )}
                      >
                        {categoryLabel(article.category)}
                      </span>
                      <p className="truncate text-sm font-medium text-[--text-primary]">
                        {article.title}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-[--text-tertiary]"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
