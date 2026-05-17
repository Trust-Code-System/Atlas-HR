"use client";

export function NpsSegment({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className={`h-full ${color}`}
    />
  );
}

export function RatingBarFill({ pct }: { pct: number }) {
  return (
    <div
      ref={(el) => { if (el) el.style.width = `${pct}%`; }}
      className="h-full bg-amber-400 rounded-full"
    />
  );
}
