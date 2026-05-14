"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface KnowledgeSearchItem {
  title: string;
  href: string;
  type: string;
  excerpt: string;
}

export function KnowledgeSearch({ items }: { items: KnowledgeSearchItem[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return items
      .filter((item) => `${item.title} ${item.type} ${item.excerpt}`.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [items, query]);

  return (
    <div className="relative mx-auto w-full max-w-3xl text-left">
      <div className="flex items-center gap-3 rounded-xl border border-[--border] bg-[--bg-card] px-4 py-3.5 shadow-sm">
        <Search size={20} aria-hidden="true" className="shrink-0 text-[--text-tertiary]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles, country guides, industry guides, tools, templates..."
          aria-label="Search knowledge base"
          className="min-h-0 flex-1 border-0 bg-transparent px-0 text-base text-[--text-primary] shadow-none focus-visible:ring-0 placeholder:text-[--text-tertiary]"
        />
      </div>

      {results.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[--border] bg-[--bg-card] shadow-[var(--shadow-dropdown)]">
          {results.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-b border-[--border] px-4 py-3 last:border-b-0 hover:bg-[--bg-hover]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[--text-primary]">{item.title}</p>
                <span className="shrink-0 rounded-full bg-[--accent-soft] px-2 py-0.5 text-[10px] font-semibold text-[--accent]">
                  {item.type}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-[--text-secondary]">{item.excerpt}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
