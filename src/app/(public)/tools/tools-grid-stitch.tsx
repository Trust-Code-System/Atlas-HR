"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calculator,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  LogOut,
  Mail,
  MessageSquare,
  Rocket,
  Sparkles,
  TrendingUp,
  UserSearch,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SerializableToolConfig } from "@/lib/tools-config";

type Filter = "all" | "ai" | "calculator";

const CATEGORY_ORDER = [
  "Recruitment",
  "Employee Relations",
  "Performance",
  "Onboarding",
  "Offboarding",
  "Calculators",
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Recruitment: UserSearch,
  "Employee Relations": Users,
  Offboarding: LogOut,
  Onboarding: Rocket,
  Performance: TrendingUp,
  Calculators: Calculator,
};

const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
  FileText,
  MessageSquare,
  Mail,
  AlertTriangle,
  LogOut,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Calculator,
};

function toolCardIcon(tool: SerializableToolConfig): LucideIcon {
  if (tool.toolType === "calculator") {
    if (tool.slug.includes("turnover")) return BarChart3;
    if (
      tool.slug.includes("salary") ||
      tool.slug.includes("pay") ||
      tool.slug.includes("equity")
    )
      return DollarSign;
    return Calculator;
  }
  return LUCIDE_BY_NAME[tool.icon] ?? FileText;
}

function sortCategories(cats: string[]) {
  return [...cats].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function ToolsGridStitch({ tools }: { tools: SerializableToolConfig[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return tools;
    if (filter === "ai") return tools.filter((t) => t.toolType !== "calculator");
    return tools.filter((t) => t.toolType === "calculator");
  }, [filter, tools]);

  const categories = sortCategories([...new Set(filtered.map((t) => t.category))]);
  const byCategory = Object.fromEntries(
    categories.map((c) => [c, filtered.filter((t) => t.category === c)])
  );

  return (
    <section className="mb-10">
      <div className="mb-8 flex flex-wrap gap-3">
        {(["all", "ai", "calculator"] as const).map((f) => (
          <Button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "h-auto rounded-xl px-5 py-2.5 text-sm font-semibold",
              filter === f
                ? "bg-[--accent] text-[--primary-foreground] hover:bg-[--accent-hover]"
                : "border border-[--border] bg-[--bg-card] text-[--text-secondary] hover:border-[--accent] hover:bg-[--bg-card] hover:text-[--accent]"
            )}
          >
            {f === "ai" && <Sparkles size={16} aria-hidden className="mr-1.5 shrink-0" />}
            {f === "calculator" && <Calculator size={16} aria-hidden className="mr-1.5 shrink-0" />}
            {f === "all" ? "All tools" : f === "ai" ? "AI generators" : "Calculators"}
          </Button>
        ))}
      </div>

      {categories.map((category) => {
        const list = byCategory[category];
        if (!list?.length) return null;
        const CatIcon = CATEGORY_ICONS[category] ?? FileText;
        const cols =
          list.length >= 4
            ? "md:grid-cols-2 lg:grid-cols-4"
            : list.length === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2";

        return (
          <div key={category} className="mb-10">
            <div className="mb-6 flex items-center gap-2">
              <CatIcon className="size-6 shrink-0 text-[--accent]" aria-hidden />
              <h2 className="text-xl font-semibold text-[--text-primary]">{category}</h2>
            </div>
            <div className={`grid grid-cols-1 gap-4 ${cols}`}>
              {list.map((tool) => {
                const isCalc = tool.toolType === "calculator";
                const ToolIcon = toolCardIcon(tool);
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-[--border] bg-[--bg-card] p-4 transition-all hover:border-[--accent] hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            isCalc
                              ? "bg-[--success]/10 text-[--success]"
                              : "bg-[--accent-soft] text-[--accent]"
                          )}
                        >
                          <ToolIcon size={22} aria-hidden />
                        </div>
                        {isCalc ? (
                          <span className="rounded-full bg-[--success]/10 px-2 py-0.5 text-[10px] font-semibold text-[--success]">
                            Free
                          </span>
                        ) : (
                          <span className="rounded-full bg-[--accent-soft] px-2 py-0.5 text-[10px] font-semibold text-[--accent]">
                            AI
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 text-base font-semibold text-[--text-primary]">
                        {tool.name}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-[--text-secondary]">
                        {tool.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "block w-full rounded-lg py-2 text-center text-xs font-semibold transition-colors",
                        isCalc
                          ? "border border-[--border] text-[--text-secondary] group-hover:bg-[--bg-hover] group-hover:text-[--text-primary]"
                          : "bg-[--accent-soft] text-[--accent] group-hover:bg-[--accent] group-hover:text-[--primary-foreground]"
                      )}
                    >
                      {isCalc ? "Calculate →" : "Generate →"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
