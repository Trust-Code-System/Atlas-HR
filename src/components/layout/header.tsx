"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Menu, Search, Sun, Moon, Palette, Bell, LogIn, Command,
  FileText, Wrench, BookOpen, LogOut, Settings, LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/stores/sidebar-store";
import { useAccent } from "@/hooks/use-accent";
import { useUser } from "@/hooks/use-user";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { TEMPLATES } from "@/lib/templates-data";
import { HR_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useTransition } from "react";
import { signOut } from "@/app/(auth)/actions";

type SearchResult = { href: string; label: string; meta: string; icon: React.ElementType };

function useSearch(query: string): SearchResult[] {
  return useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];
    TOOLS_CONFIG.forEach((t) => {
      if (t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        results.push({ href: `/tools/${t.slug}`, label: t.name, meta: "Tool", icon: Wrench });
    });
    TEMPLATES.forEach((t) => {
      if (t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        results.push({ href: `/templates/${t.slug}`, label: t.name, meta: "Template", icon: FileText });
    });
    HR_CATEGORIES.forEach((c) => {
      if (c.label.toLowerCase().includes(q))
        results.push({ href: `/knowledge/${c.slug}`, label: c.label, meta: "Knowledge", icon: BookOpen });
    });
    return results.slice(0, 8);
  }, [query]);
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.6, opacity: 0, rotate: 30 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}

function AccentToggle() {
  const { accent, setAccent } = useAccent();
  return (
    <Popover>
      <PopoverTrigger
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
        aria-label="Change accent color"
      >
        <Palette size={18} />
      </PopoverTrigger>
      <PopoverContent className="w-40 p-3" align="end">
        <p className="mb-2 text-xs font-medium text-[--text-tertiary]">Accent color</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAccent("blue")}
            className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-chart-1 ring-offset-2 transition-all", accent === "blue" && "ring-2 ring-chart-1")}
            aria-label="Blue accent"
          />
          <button type="button" onClick={() => setAccent("purple")}
            className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-chart-4 ring-offset-2 transition-all", accent === "purple" && "ring-2 ring-chart-4")}
            aria-label="Purple accent"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { user, profile, loading } = useUser();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-[--bg-hover] animate-pulse" />;
  }

  if (!user || !profile) {
    return (
      <Link
        href="/sign-in"
        className="ml-1 flex h-9 items-center gap-2 rounded-lg bg-[--accent] px-3 text-sm font-medium text-[--primary-foreground] hover:bg-[--accent-hover] transition-colors"
      >
        <LogIn size={15} />
        Sign in
      </Link>
    );
  }

  const initials = (profile.full_name ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Popover>
      <PopoverTrigger className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[--bg-hover] transition-colors">
        <Avatar className="h-7 w-7">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
          <AvatarFallback className="bg-[--accent] text-[--primary-foreground] text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:block text-sm font-medium text-[--text-primary] max-w-[120px] truncate">
          {profile.full_name ?? user.email}
        </span>
        <ChevronDown size={14} className="text-[--text-tertiary]" />
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="end">
        <div className="px-3 py-2 border-b border-[--border] mb-1">
          <p className="text-sm font-medium text-[--text-primary] truncate">
            {profile.full_name ?? "My Account"}
          </p>
          <p className="text-xs text-[--text-tertiary] truncate">{user.email}</p>
        </div>
        <Link href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
        >
          <LayoutDashboard size={15} /> Dashboard
        </Link>
        <Link href="/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors"
        >
          <Settings size={15} /> Settings
        </Link>
        <div className="border-t border-[--border] mt-1 pt-1">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchBar({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--bg-input] px-3 text-sm text-[--text-tertiary] hover:border-[--border-strong] transition-colors w-full max-w-xs"
      aria-label="Open search"
    >
      <Search size={14} />
      <span>Search Atlas...</span>
      <kbd className="ml-auto flex items-center gap-0.5 rounded border border-[--border] px-1.5 py-0.5 text-xs">
        <Command size={10} />K
      </kbd>
    </button>
  );
}

export function Header() {
  const { openMobile } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useSearch(query);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const closeSearch = () => { setSearchOpen(false); setQuery(""); };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[--border] bg-[--bg-app] px-4">
        <button
          type="button"
          onClick={openMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] hover:bg-[--bg-hover] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1">
          <SearchBar onOpen={() => setSearchOpen(true)} />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AccentToggle />

          {/* Notification bell */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[--accent]" />
          </button>

          <UserMenu />
        </div>
      </header>

      {/* Command palette */}
      <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setQuery(""); }}>
        <DialogContent className="sm:max-w-xl bg-[--bg-card] border-[--border] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Search Atlas</DialogTitle>
          <div className="flex items-center gap-2 border-b border-[--border] px-4 py-3">
            <Search size={16} className="shrink-0 text-[--text-tertiary]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, templates, knowledge..."
              className="flex-1 bg-transparent text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-xs text-[--text-tertiary] hover:text-[--text-primary]">
                Clear
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <ul className="py-2">
                {results.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} onClick={closeSearch}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[--bg-hover] transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[--accent-soft]">
                        <r.icon size={14} className="text-[--accent]" />
                      </div>
                      <span className="flex-1 text-sm text-[--text-primary]">{r.label}</span>
                      <span className="text-xs text-[--text-tertiary]">{r.meta}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query ? (
              <div className="py-8 text-center text-sm text-[--text-tertiary]">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="px-4 py-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--text-tertiary]">Quick links</p>
                <ul className="space-y-1">
                  {[
                    { href: "/tools", label: "Tools & Generators", icon: Wrench },
                    { href: "/knowledge", label: "Knowledge Hub", icon: BookOpen },
                    { href: "/templates", label: "Templates", icon: FileText },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={closeSearch}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[--bg-hover] transition-colors"
                      >
                        <l.icon size={14} className="text-[--text-tertiary]" />
                        <span className="text-sm text-[--text-secondary]">{l.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-[--border] px-4 py-2 flex items-center gap-3 text-xs text-[--text-tertiary]">
            <kbd className="rounded border border-[--border] px-1.5 py-0.5">↵</kbd> to open
            <kbd className="rounded border border-[--border] px-1.5 py-0.5">Esc</kbd> to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}