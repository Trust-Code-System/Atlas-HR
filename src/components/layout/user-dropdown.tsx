"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/(auth)/actions";

interface Props {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export function UserDropdown({ name, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-navy-50 transition-colors"
      >
        <Avatar src={avatarUrl} name={name ?? email} size="sm" />
        <p className="hidden sm:block text-sm font-semibold text-navy-900 leading-tight max-w-32 truncate">
          {name ?? email?.split("@")[0] ?? "Account"}
        </p>
        <svg
          className={`h-4 w-4 text-navy-400 hidden sm:block transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-navy-200 rounded-xl shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-navy-100">
            <p className="text-sm font-semibold text-navy-900 truncate">{name ?? email?.split("@")[0] ?? "Account"}</p>
            <p className="text-xs text-navy-400 truncate">{email}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My profile
          </Link>
          <Link
            href="/settings/org"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
          >
            <svg className="h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Organisation
          </Link>

          <div className="border-t border-navy-100 mt-1">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
