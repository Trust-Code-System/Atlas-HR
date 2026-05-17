"use client";

import type { CSSProperties } from "react";

export function DeptBar({ pct }: { pct: number }) {
  const fillStyle: CSSProperties = { width: `${pct}%` };
  return (
    <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full" style={fillStyle} />
    </div>
  );
}

export function Bar({ pct, color = "bg-blue-500", height = "h-3" }: {
  pct: number;
  color?: string;
  height?: string;
}) {
  const fillStyle: CSSProperties = { width: `${Math.min(pct, 100)}%` };
  return (
    <div className={`flex-1 ${height} bg-navy-100 rounded-full overflow-hidden`}>
      <div className={`h-full ${color} rounded-full`} style={fillStyle} />
    </div>
  );
}
