"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const NAV = [
  { href: "/settings", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/settings/org", label: "Organisation", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" },
  { href: "/settings/team", label: "Team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/settings/audit-log", label: "Audit log", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeHref = isPending && pendingHref ? pendingHref : pathname;

  useEffect(() => {
    for (const item of NAV) router.prefetch(item.href);
  }, [router]);

  return (
    <div className="flex w-fit items-center gap-1 rounded-xl border border-navy-200 bg-navy-50 p-1 mb-6">
      {NAV.map((item) => {
        const isActive = activeHref === item.href;
        const isLoading = isPending && pendingHref === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onFocus={() => router.prefetch(item.href)}
            onPointerEnter={() => router.prefetch(item.href)}
            onPointerDown={() => router.prefetch(item.href)}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0 ||
                pathname === item.href
              ) {
                return;
              }

              event.preventDefault();
              setPendingHref(item.href);
              startTransition(() => router.push(item.href));
            }}
            aria-current={isActive ? "page" : undefined}
            aria-busy={isLoading ? true : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-navy-200 bg-white text-navy-900 shadow-sm"
                : "border-transparent text-navy-500 hover:bg-white/60 hover:text-navy-800"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.label}
            {isLoading && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
          </Link>
        );
      })}
    </div>
  );
}
