import type { ReactNode } from "react";

// ─── Callout ──────────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info: {
    wrap: "border-blue-200 bg-blue-50",
    icon: (
      <svg className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "text-blue-900",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    icon: (
      <svg className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    text: "text-amber-900",
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50",
    icon: (
      <svg className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: "text-emerald-900",
  },
  tip: {
    wrap: "border-blue-200 bg-blue-50",
    icon: (
      <svg className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M9.75 15.75h4.5M9 10a3 3 0 116 0c0 1.5-1 2.25-1.75 2.75-.72.48-1.25.82-1.25 1.75" />
      </svg>
    ),
    text: "text-blue-900",
  },
  danger: {
    wrap: "border-red-200 bg-red-50",
    icon: (
      <svg className="h-4 w-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
    text: "text-red-900",
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "success" | "tip" | "danger";
  children: ReactNode;
}) {
  const s = CALLOUT_STYLES[type];
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 my-4 ${s.wrap}`}>
      {s.icon}
      <div className={`text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-1 [&>a]:underline ${s.text}`}>
        {children}
      </div>
    </div>
  );
}

export function Checklist({ children }: { id?: string; children: ReactNode }) {
  return (
    <div className="my-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 [&_ul]:my-1 [&_li]:py-1 [&_li]:text-sm [&_li]:text-emerald-950 [&_li]:leading-relaxed [&_li]:marker:text-emerald-500">
      {children}
    </div>
  );
}

export function CountryNote({ country, children }: { country: string; children: ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{country} note</p>
      <div className="text-sm leading-7 text-slate-700 [&>p]:mb-0">{children}</div>
    </div>
  );
}

export function Comparison({ columns, children }: { columns?: string[]; children: ReactNode }) {
  return (
    <div className="my-5 rounded-xl border border-slate-200 bg-white p-4">
      {columns && columns.length > 0 && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          {columns.map((column) => (
            <p key={column} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {column}
            </p>
          ))}
        </div>
      )}
      <div className="text-sm leading-7 text-slate-700">{children}</div>
    </div>
  );
}

export function Stat({ value, label, source }: { value: string; label: string; source?: string }) {
  return (
    <div className="my-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
      <p className="font-mono text-3xl font-bold text-blue-700">{value}</p>
      <p className="mt-2 text-sm leading-6 text-navy-700">{label}</p>
      {source && <p className="mt-2 text-xs text-navy-400">Source: {source}</p>}
    </div>
  );
}

export function TemplateCTA({ slug, children }: { slug: string; children?: ReactNode }) {
  return (
    <a href={`/templates#${slug}`} className="my-4 block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
      {children ?? "Open related template"}
    </a>
  );
}

export function ToolCTA({ slug, children }: { slug: string; children?: ReactNode }) {
  return (
    <a href={`/tools#${slug}`} className="my-4 block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
      {children ?? "Open related tool"}
    </a>
  );
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

export function Disclaimer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 my-5 text-xs text-slate-600 leading-relaxed">
      <strong className="text-slate-700">Disclaimer:</strong> This guide is practical HR reference material, not legal advice. Employment law varies by jurisdiction and changes frequently. Verify current statutory figures, contribution rates, and procedural requirements with qualified local employment counsel before acting on sensitive HR matters.
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 [&_ol]:my-1 [&_li]:py-0.5 [&_li]:text-sm [&_li]:text-navy-800 [&_li]:leading-relaxed">
      {children}
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

interface FAQItem {
  q: string;
  a: string;
}

export function FAQ({
  items = [],
  children,
}: {
  items?: FAQItem[];
  children?: ReactNode;
  preset?: string;
}) {
  if (items.length === 0 && !children) {
    return null;
  }

  return (
    <div className="my-6 space-y-2.5">
      <h3 className="font-bold text-navy-900 text-base mb-3">Frequently Asked Questions</h3>
      {items.length > 0 ? (
        items.map((item, i) => (
          <details key={i} className="group rounded-xl border border-slate-200 bg-white open:shadow-sm transition-shadow">
            <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy-900 list-none marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <svg className="h-4 w-4 text-navy-400 shrink-0 ml-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600 leading-relaxed">
              {item.a}
            </div>
          </details>
        ))
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Heading overrides (for anchor IDs) ───────────────────────────────────────

function headingId(children: ReactNode): string {
  return String(children)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function H2({ children }: { children?: ReactNode }) {
  const id = headingId(children);
  return (
    <h2
      id={id}
      className="text-xl font-bold text-navy-900 mt-8 mb-3 pb-2 border-b border-slate-200 scroll-mt-20"
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children?: ReactNode }) {
  const id = headingId(children);
  return (
    <h3 id={id} className="text-base font-semibold text-navy-800 mt-5 mb-2 scroll-mt-20">
      {children}
    </h3>
  );
}

// ─── Prose wrappers ───────────────────────────────────────────────────────────

export function P({ children }: { children?: ReactNode }) {
  return <p className="text-sm text-slate-700 leading-7 mb-3">{children}</p>;
}

export function UL({ children }: { children?: ReactNode }) {
  return (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-slate-400">
      {children}
    </ul>
  );
}

export function OL({ children }: { children?: ReactNode }) {
  return (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-slate-500 marker:font-semibold">
      {children}
    </ol>
  );
}

export function LI({ children }: { children?: ReactNode }) {
  return <li className="text-sm text-slate-700 leading-relaxed">{children}</li>;
}

export function A({ href, children }: { href?: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
    >
      {children}
    </a>
  );
}

export function Strong({ children }: { children?: ReactNode }) {
  return <strong className="font-semibold text-navy-900">{children}</strong>;
}

export function HR() {
  return <hr className="border-slate-200 my-6" />;
}

// ─── Component map ────────────────────────────────────────────────────────────

export const COUNTRY_MDX_COMPONENTS = {
  Callout,
  Checklist,
  CountryNote,
  Comparison,
  Disclaimer,
  Stat,
  Steps,
  TemplateCTA,
  ToolCTA,
  FAQ,
  h2: H2,
  h3: H3,
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
  a: A,
  strong: Strong,
  hr: HR,
};
