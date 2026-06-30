"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface AppNotification {
  id: string;
  type: "leave" | "payroll" | "task" | "recruiting" | "info";
  title: string;
  body: string;
  time: string;
  href: string;
  urgent?: boolean;
}

const TYPE_STYLES: Record<AppNotification["type"], { icon: React.ReactNode; dot: string; bg: string }> = {
  leave: {
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    icon: (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  payroll: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    icon: (
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  task: {
    dot: "bg-violet-500",
    bg: "bg-violet-50",
    icon: (
      <svg className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  recruiting: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    icon: (
      <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  info: {
    dot: "bg-sky-500",
    bg: "bg-sky-50",
    icon: (
      <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function NotificationPanel({ initialNotifications }: { initialNotifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.length;
  const urgentCount = notifications.filter((n) => n.urgent).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread})` : ""}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center tabular-nums ${urgentCount > 0 ? "bg-red-500" : "bg-blue-500"}`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-navy-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-navy-900 text-sm">Notifications</h3>
              {unread > 0 && (
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${urgentCount > 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => setNotifications([])}
                className="text-xs text-navy-400 hover:text-navy-700 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-navy-700">You&apos;re all caught up</p>
                <p className="text-xs text-navy-400 mt-0.5">No pending items right now.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_STYLES[n.type];
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => { dismiss(n.id); setOpen(false); }}
                    className={`flex gap-3 px-4 py-3.5 border-b border-navy-50 last:border-0 hover:bg-navy-50 transition-colors ${n.urgent ? "bg-red-50/40" : "bg-blue-50/30"}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                        {style.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-snug ${n.urgent ? "text-red-800" : "text-navy-900"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-navy-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-navy-400 mt-1 font-medium">{n.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }}
                      className="shrink-0 mt-0.5 p-1 rounded-md text-navy-300 hover:text-navy-500 hover:bg-navy-100 transition-colors"
                      aria-label="Dismiss"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
