"use client";

import dynamic from "next/dynamic";

// The calculator is a below-the-fold, interactive client component. Load it
// lazily (client-only) so its JS doesn't weigh down the initial homepage
// payload. A fixed-height skeleton preserves layout to avoid CLS.
const GlobalHiringCalculator = dynamic(
  () => import("./global-hiring-calculator").then((m) => m.GlobalHiringCalculator),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[420px] gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-6" />
        <div className="animate-pulse rounded-2xl border border-navy-800 bg-navy-900/60 p-6" />
      </div>
    ),
  }
);

export function GlobalHiringCalculatorLazy() {
  return <GlobalHiringCalculator />;
}
