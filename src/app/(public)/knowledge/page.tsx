import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Brain,
  CalendarDays,
  DollarSign,
  Factory,
  FileText,
  Gavel,
  Globe,
  Library,
  Rocket,
  ShoppingBag,
  Stethoscope,
  Terminal,
  TrendingUp,
  UserSearch,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HR_CATEGORIES } from "@/lib/constants";
import { getAllArticles, getCountryGuides, getIndustryGuides } from "@/lib/mdx";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { TEMPLATES } from "@/lib/templates-data";
import { KnowledgeHeroVisual } from "@/components/knowledge/knowledge-hero-visual";
import { KnowledgeSearch, type KnowledgeSearchItem } from "./knowledge-search";

const HUB_STATS = [
  { value: "200+", label: "Articles & guides" },
  { value: "30+", label: "HR templates" },
  { value: "15+", label: "Free calculators" },
  { value: "6", label: "Country modules" },
];

export const metadata: Metadata = {
  title: "HR Knowledge Hub",
  description:
    "HR articles, country guides, industry guides, calculators, templates, and glossary definitions for HR professionals worldwide.",
};

const lifecycle = [
  { label: "Attract", href: "/knowledge/recruitment-and-talent-acquisition", primary: true },
  { label: "Hire", href: "/knowledge/recruitment-and-talent-acquisition", primary: false },
  { label: "Onboard", href: "/knowledge/onboarding-and-induction", primary: false },
  { label: "Develop", href: "/knowledge/performance-management", primary: false },
  { label: "Reward", href: "/knowledge/compensation-reward-and-benefits", primary: false },
  { label: "Support", href: "/knowledge/employee-relations", primary: false },
  { label: "Exit", href: "/knowledge/offboarding-and-exit-management", primary: false },
];

const TOPIC_CLUSTERS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/knowledge/compliance-and-labour-law", label: "Labor Law", Icon: Gavel },
  { href: "/knowledge/payroll-administration", label: "Payroll & Tax", Icon: Banknote },
  { href: "/knowledge/diversity-equity-and-inclusion", label: "DEI Initiatives", Icon: UsersRound },
  { href: "/knowledge/employee-engagement-and-culture", label: "Workplace Culture", Icon: Brain },
];

const INDUSTRY_TILES: { slug: string; label: string }[] = [
  { slug: "technology", label: "Tech & SaaS" },
  { slug: "manufacturing", label: "Manufacturing" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "retail", label: "Retail" },
];

function IndustryTileIcon({ slug, className }: { slug: string; className?: string }) {
  switch (slug) {
    case "technology":
      return <Terminal className={className} aria-hidden="true" />;
    case "manufacturing":
      return <Factory className={className} aria-hidden="true" />;
    case "healthcare":
      return <Stethoscope className={className} aria-hidden="true" />;
    case "retail":
      return <ShoppingBag className={className} aria-hidden="true" />;
    default:
      return <BookOpen className={className} aria-hidden="true" />;
  }
}

const FLAG: Record<string, string> = {
  nigeria: "🇳🇬",
  india: "🇮🇳",
  kenya: "🇰🇪",
  philippines: "🇵🇭",
  "united-kingdom": "🇬🇧",
  "united-states": "🇺🇸",
};

function categoryLabel(category: string): string {
  const m: Record<string, string> = {
    "compliance-and-labour-law": "COMPLIANCE",
    "compensation-reward-and-benefits": "COMPENSATION",
    "recruitment-and-talent-acquisition": "RECRUITING",
    "hr-policies-and-employee-handbook": "POLICY",
    "employee-relations": "RELATIONS",
  };
  return m[category] ?? category.split("-")[0]!.toUpperCase().slice(0, 14);
}

const CATEGORY_STYLES: Record<string, { bg: string; fg: string; Icon: LucideIcon }> = {
  "compliance-and-labour-law":        { bg: "bg-[--danger]/20",   fg: "text-[--danger]",   Icon: Gavel },
  "discipline-and-grievance":         { bg: "bg-[--danger]/20",   fg: "text-[--danger]",   Icon: AlertTriangle },
  "performance-management":           { bg: "bg-[--warning]/20",  fg: "text-[--warning]",  Icon: TrendingUp },
  "leave-and-attendance":             { bg: "bg-[--warning]/20",  fg: "text-[--warning]",  Icon: CalendarDays },
  "compensation-reward-and-benefits": { bg: "bg-[--success]/20",  fg: "text-[--success]",  Icon: Banknote },
  "payroll-administration":           { bg: "bg-[--success]/20",  fg: "text-[--success]",  Icon: DollarSign },
  "onboarding-and-induction":         { bg: "bg-[--success]/20",  fg: "text-[--success]",  Icon: Rocket },
  "recruitment-and-talent-acquisition": { bg: "bg-[--accent]/20", fg: "text-[--accent]",   Icon: UserSearch },
  "hr-policies-and-employee-handbook":  { bg: "bg-[--accent]/20", fg: "text-[--accent]",   Icon: FileText },
  "employee-relations":               { bg: "bg-[--warning]/20",  fg: "text-[--warning]",  Icon: Users },
};

function articleStyle(category: string) {
  return CATEGORY_STYLES[category] ?? { bg: "bg-[--accent]/20", fg: "text-[--accent]", Icon: BookOpen };
}

export default function KnowledgeHubPage() {
  const articles = getAllArticles();
  const countryGuides = getCountryGuides();
  const industryGuides = getIndustryGuides();
  const recentArticles = [...articles]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 9);
  const featuredSlugs = [
    "how-to-fire-someone-with-dignity-and-legally",
    "how-to-design-a-salary-structure-from-scratch",
    "the-complete-guide-to-structured-interviews",
  ];
  const featured = featuredSlugs
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter(Boolean);

  const searchItems: KnowledgeSearchItem[] = [
    ...articles.map((article) => ({
      title: article.title,
      href: `/knowledge/${article.category}/${article.slug}`,
      type: "Article",
      excerpt: article.excerpt,
    })),
    ...countryGuides.map((guide) => ({
      title: guide.title,
      href: `/knowledge/country/${guide.slug}`,
      type: "Country",
      excerpt: guide.excerpt,
    })),
    ...industryGuides.map((guide) => ({
      title: guide.title,
      href: `/knowledge/industry/${guide.slug}`,
      type: "Industry",
      excerpt: guide.excerpt,
    })),
    ...TOOLS_CONFIG.map((tool) => ({
      title: tool.name,
      href: `/tools/${tool.slug}`,
      type: tool.toolType === "calculator" ? "Calculator" : "Tool",
      excerpt: tool.description,
    })),
    ...TEMPLATES.map((template) => ({
      title: template.name,
      href: `/templates/${template.slug}`,
      type: "Template",
      excerpt: template.description,
    })),
  ];

  const industryBySlug = new Map(industryGuides.map((g) => [g.slug, g]));

  return (
    <main>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section className="bg-[--accent] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[--primary-foreground]/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[--primary-foreground]">
                <BookOpen size={14} aria-hidden="true" />
                Atlas HR reference library
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[--primary-foreground] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                HR answers, tools, and country guidance — all searchable
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[--primary-foreground]/80">
                Articles, country guides, calculators, and templates for HR professionals in every
                country.
              </p>
              <div className="mt-8">
                <KnowledgeSearch items={searchItems} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {countryGuides.slice(0, 4).map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/knowledge/country/${guide.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[--primary-foreground]/25 bg-[--primary-foreground]/10 px-3 py-1.5 text-xs font-medium text-[--primary-foreground] transition-colors hover:bg-[--primary-foreground]/20"
                  >
                    <span aria-hidden="true">{FLAG[guide.slug] ?? "🌍"}</span>
                    {guide.title.replace(/\s+HR Guide$/i, "")}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/knowledge/compliance-and-labour-law"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[--primary-foreground] px-5 text-sm font-semibold text-[--accent] shadow-lg transition-colors hover:bg-[--bg-input]"
                >
                  Browse articles
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[--primary-foreground]/30 bg-[--primary-foreground]/10 px-5 text-sm font-semibold text-[--primary-foreground] transition-colors hover:bg-[--primary-foreground]/20"
                >
                  Explore tools
                </Link>
              </div>
            </div>

            <KnowledgeHeroVisual
              articles={featured.map((a) => ({
                slug: a!.slug,
                title: a!.title,
                category: a!.category,
                excerpt: a!.excerpt,
                heroImage: a!.heroImage,
              }))}
              categoryLabel={categoryLabel}
              articleStyle={articleStyle}
            />
          </div>

          <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl border border-[--primary-foreground]/20 bg-[--primary-foreground]/10 p-6 sm:grid-cols-4 sm:gap-8 sm:p-8">
            {HUB_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-[--primary-foreground] sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[--primary-foreground]/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Today's Brief + HR Dictionary ────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
                    Featured this week
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[--text-primary] sm:text-3xl">
                    Today&apos;s Brief
                  </h2>
                </div>
                <Link
                  href="/knowledge/compliance-and-labour-law"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[--accent] underline-offset-4 hover:underline"
                >
                  View all <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {featured.map((article, i) => {
                  const { bg, fg, Icon: CatIcon } = articleStyle(article!.category);
                  return (
                  <Link
                    key={article!.slug}
                    href={`/knowledge/${article!.category}/${article!.slug}`}
                    className="group overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] transition-[border-color,box-shadow,transform] duration-[280ms] hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-lg"
                  >
                    {article!.heroImage ? (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={article!.heroImage}
                          alt={article!.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width:768px) 100vw, 33vw"
                          priority={i === 0}
                        />
                      </div>
                    ) : (
                      <div className={cn("flex h-32 w-full items-center justify-center", bg)}>
                        <CatIcon size={48} className={fg} aria-hidden="true" />
                      </div>
                    )}
                    <div className="p-4">
                      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", bg, fg)}>
                        {categoryLabel(article!.category)}
                      </span>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-[--text-primary] transition-colors group-hover:text-[--accent] sm:text-lg">
                        {article!.title}
                      </h3>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4">
              <Link
                href="/knowledge/glossary"
                className="group flex h-full min-h-[280px] flex-col justify-between rounded-xl bg-[--accent] p-8 text-[--primary-foreground] shadow-md transition-[box-shadow,transform] duration-[280ms] hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="space-y-4">
                  <Library size={48} className="text-[--primary-foreground]" aria-hidden="true" />
                  <h2 className="text-2xl font-semibold leading-tight">200+ HR terms</h2>
                  <p className="text-sm leading-relaxed text-[--primary-foreground]/80">
                    From &apos;At-will employment&apos; to &apos;Zero-hours contracts&apos;, master the
                    global HR vernacular.
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-1">
                  Browse A–Z
                  <ArrowRight size={16} aria-hidden="true" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Country Guides ───────────────────────────────── */}
      <section className="bg-[--bg-input] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[--accent-soft]">
              <Globe size={20} className="text-[--accent]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
                Country-specific HR
              </p>
              <h2 className="text-2xl font-semibold text-[--text-primary]">Browse by Country</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {countryGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/knowledge/country/${guide.slug}`}
                className="group flex items-center justify-between rounded-xl border border-[--border] bg-[--bg-card] p-4 transition-[border-color,box-shadow] duration-[280ms] hover:border-[--accent] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {FLAG[guide.slug] ?? "🌍"}
                  </span>
                  <span className="text-sm font-semibold text-[--text-primary]">
                    {guide.title.replace(/\s+HR Guide$/i, "")}
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[--text-tertiary] transition-colors group-hover:text-[--accent]"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Industry + Employee Lifecycle ────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-xl font-semibold text-[--text-primary] sm:text-2xl">
                Browse by Industry
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_TILES.flatMap((tile) => {
                  const guide = industryBySlug.get(tile.slug);
                  if (!guide) return [];
                  return [
                    <Link
                      key={tile.slug}
                      href={`/knowledge/industry/${tile.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-[--border] bg-[--bg-card] p-4 transition-[border-color,box-shadow,transform] duration-[280ms] hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-md"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft] transition-colors group-hover:bg-[--accent]">
                        <IndustryTileIcon
                          slug={tile.slug}
                          className="size-5 text-[--accent] transition-colors group-hover:text-[--primary-foreground]"
                        />
                      </span>
                      <span className="text-sm font-semibold text-[--text-primary]">
                        {tile.label}
                      </span>
                    </Link>,
                  ];
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-6 text-xl font-semibold text-[--text-primary] sm:text-2xl">
                Employee Lifecycle
              </h2>
              <div className="flex flex-wrap gap-2">
                {lifecycle.map((stage) => (
                  <Link
                    key={stage.label}
                    href={stage.href}
                    className={
                      stage.primary
                        ? "rounded-full bg-[--accent] px-5 py-2.5 text-sm font-semibold text-[--primary-foreground] shadow-sm transition-colors hover:bg-[--accent-hover]"
                        : "rounded-full border border-[--border] bg-[--bg-card] px-5 py-2.5 text-sm font-semibold text-[--text-secondary] transition-colors hover:border-[--accent] hover:text-[--accent]"
                    }
                  >
                    {stage.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Topic Clusters ───────────────────────────────── */}
      <section className="bg-[--bg-input] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-semibold text-[--text-primary] sm:text-3xl">
            Topic Clusters
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {TOPIC_CLUSTERS.map((cluster) => (
              <Link
                key={cluster.href}
                href={cluster.href}
                className="group flex flex-col items-center rounded-xl border border-[--border] bg-[--bg-card] p-8 text-center transition-[border-color,box-shadow,transform] duration-[280ms] hover:-translate-y-0.5 hover:border-[--accent] hover:shadow-md"
              >
                <span className="mb-4 flex size-14 items-center justify-center rounded-xl bg-[--accent-soft] transition-colors group-hover:bg-[--accent]">
                  <cluster.Icon
                    size={28}
                    className="text-[--accent] transition-colors group-hover:text-[--primary-foreground]"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm font-semibold text-[--text-primary]">
                  {cluster.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Recently Added ───────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-semibold text-[--text-primary] sm:text-3xl">
            Recently Added
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {recentArticles.slice(0, 3).map((article) => {
              const { bg, fg, Icon: CatIcon } = articleStyle(article.category);
              return (
              <Link
                key={article.slug}
                href={`/knowledge/${article.category}/${article.slug}`}
                className="group space-y-4"
              >
                <div className="overflow-hidden rounded-xl">
                  {article.heroImage ? (
                    <div className="relative h-48">
                      <Image
                        src={article.heroImage}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className={cn("flex h-44 items-center justify-center", bg)}>
                      <CatIcon size={52} className={fg} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", bg, fg)}>
                    {categoryLabel(article.category)}
                  </span>
                  <h3 className="text-lg font-semibold leading-snug text-[--text-primary] transition-colors group-hover:text-[--accent]">
                    {article.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-[--text-secondary]">{article.excerpt}</p>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7: All HR Categories ────────────────────────────── */}
      <section className="border-t border-[--border] bg-[--bg-input] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-semibold text-[--text-primary] sm:text-3xl">
            All HR categories
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {HR_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/knowledge/${cat.slug}`}
                className="rounded-xl border border-[--border] bg-[--bg-card] p-5 text-sm font-semibold text-[--text-primary] transition-[border-color,box-shadow] duration-[280ms] hover:border-[--accent] hover:shadow-md"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Sign-up CTA ──────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[--accent] px-6 py-14 text-center text-[--primary-foreground] shadow-2xl sm:px-10 md:px-20">
          <Library size={32} className="mx-auto text-[--primary-foreground]" aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-semibold md:text-4xl">
            Save articles, get weekly briefings
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[--primary-foreground]/80">
            Create a free Atlas HR account to bookmark articles, track country guides, and receive a
            curated weekly brief for your markets.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[--primary-foreground] px-6 text-sm font-semibold text-[--accent] transition-colors hover:bg-[--bg-input]"
            >
              Start for free
            </Link>
            <Link
              href="/knowledge/compliance-and-labour-law"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[--primary-foreground]/30 bg-[--primary-foreground]/10 px-6 text-sm font-semibold text-[--primary-foreground] transition-colors hover:bg-[--primary-foreground]/20"
            >
              Browse the library
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
