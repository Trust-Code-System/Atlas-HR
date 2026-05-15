"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Briefcase,
  CalendarDays,
  Download,
  FileText,
  Lock,
  LogOut,
  Search,
  Shield,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates-data";
import { cn } from "@/lib/utils";

const FORMAT_LABELS: Record<string, string> = { docx: "DOCX", pdf: "PDF", gdoc: "Google Doc" };

type CategoryStyle = { bg: string; fg: string; Icon: React.ElementType };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Contracts:    { bg: "bg-[--accent]/20",   fg: "text-[--accent]",   Icon: Briefcase },
  Policies:     { bg: "bg-[--accent]/20",   fg: "text-[--accent]",   Icon: BookOpen },
  Performance:  { bg: "bg-[--warning]/20",  fg: "text-[--warning]",  Icon: TrendingUp },
  Recruitment:  { bg: "bg-[--accent]/20",   fg: "text-[--accent]",   Icon: UserPlus },
  Onboarding:   { bg: "bg-[--success]/20",  fg: "text-[--success]",  Icon: CalendarDays },
  Offboarding:  { bg: "bg-[--warning]/20",  fg: "text-[--warning]",  Icon: LogOut },
  Discipline:   { bg: "bg-[--danger]/20",   fg: "text-[--danger]",   Icon: AlertTriangle },
  Payroll:      { bg: "bg-[--success]/20",  fg: "text-[--success]",  Icon: Banknote },
  Compliance:   { bg: "bg-[--danger]/20",   fg: "text-[--danger]",   Icon: Shield },
};

function categoryStyle(cat: string): CategoryStyle {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-[--accent]/20", fg: "text-[--accent]", Icon: FileText };
}

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showPremium, setShowPremium] = useState(true);

  const filtered = TEMPLATES.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    const matchesPremium = showPremium || !t.isPremium;
    return matchesSearch && matchesCategory && matchesPremium;
  });

  return (
    <div className="min-h-screen bg-[--bg-app]">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="bg-[--accent] py-14 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[--primary-foreground]/15 px-3 py-1 text-sm font-semibold text-[--primary-foreground]">
              <FileText size={14} aria-hidden />
              30+ templates
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[--primary-foreground] sm:text-5xl">
              Templates Library
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[--primary-foreground]/80">
              Ready-to-download HR templates. Free and premium. Every format.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Filters ──────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[200px] max-w-xs flex-1 items-center gap-2 rounded-xl border border-[--border] bg-[--bg-input] px-3 py-2.5">
            <Search size={14} className="shrink-0 text-[--text-tertiary]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search templates"
              className="flex-1 border-0 bg-transparent px-0 text-sm text-[--text-primary] shadow-none focus-visible:ring-0 placeholder:text-[--text-tertiary]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", ...TEMPLATE_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-[--accent] text-[--primary-foreground]"
                    : "border border-[--border] text-[--text-secondary] hover:border-[--accent] hover:text-[--accent]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[--text-secondary]">
            <Checkbox
              checked={showPremium}
              onCheckedChange={(value) => setShowPremium(Boolean(value))}
              aria-label="Show premium templates"
            />
            Show premium
          </label>
        </div>

        <p className="mb-6 text-sm text-[--text-tertiary]">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Grid ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const { bg, fg, Icon: CatIcon } = categoryStyle(template.category);
            return (
              <Link
                key={template.slug}
                href={`/templates/${template.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[--border] bg-[--bg-card] transition-all hover:border-[--accent] hover:shadow-md"
              >
                {/* Colored card header */}
                <div className={cn("flex h-28 w-full items-center justify-center", bg)}>
                  <CatIcon size={44} className={fg} aria-hidden />
                </div>

                {template.isPremium && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[--warning] px-2 py-0.5 text-[10px] font-semibold text-[--primary-foreground]">
                    <Lock size={9} />
                    Pro
                  </span>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-widest", fg)}>
                    {template.category}
                  </p>
                  <h3 className="font-semibold text-[--text-primary]">{template.name}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[--text-secondary]">
                    {template.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {template.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className="flex items-center gap-1 rounded-md border border-[--border] px-2 py-0.5 text-xs text-[--text-tertiary] group-hover:border-[--accent]/40 group-hover:text-[--accent]"
                      >
                        <Download size={10} />
                        {FORMAT_LABELS[fmt] ?? fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[--text-tertiary]">No templates match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
