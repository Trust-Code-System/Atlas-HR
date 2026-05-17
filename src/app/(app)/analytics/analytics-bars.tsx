"use client";

export function BarFill({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className={`h-full rounded-full transition-all ${color}`}
    />
  );
}

export function MonthlyBarColumn({ pct, hasCount }: { pct: number; hasCount: boolean }) {
  return (
    <div
      ref={(el) => { if (el) el.style.height = `${Math.max(pct, hasCount ? 8 : 2)}%`; }}
      className="w-full bg-linear-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
    />
  );
}

export function StackedBarSegment({ pct, color, title }: { pct: number; color: string; title: string }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className={color}
      title={title}
    />
  );
}

export function StatusBarFill({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className={`h-full rounded-full ${color}`}
    />
  );
}
