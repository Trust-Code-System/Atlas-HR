import Link from "next/link";
import { TEMPLATES, VARIANT_LABELS } from "@/lib/templates-data";
import { LEGAL_REVIEW_TEMPLATE_CATEGORIES } from "@/lib/trust-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

const VARIANT_CODE: Record<string, string> = {
  us: "US",
  uk: "UK",
  ng: "NG",
  in: "IN",
  global: "GL",
};

export const metadata = {
  title: "HR Templates | Atlas HR",
  description:
    "Country-aware HR templates for contracts, policies, recruitment, onboarding, performance, payroll, discipline, and offboarding.",
};

export default function TemplatesPage() {
  const categories = [...new Set(TEMPLATES.map((template) => template.category))];

  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Template library</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Global HR templates that actually localize.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Use DOCX templates with country variants for the United States, United Kingdom, Nigeria, and India, then connect them to workflows and employee records.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/countries" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              See country variants
            </Link>
            <Link href="/workflows" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Bundle into workflows
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric value={TEMPLATES.length.toString()} label="document templates" />
            <Metric value="4" label="country-specific markets" />
            <Metric value="DOCX" label="download format" />
          </div>

          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-2xl font-bold text-navy-900">{category}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {TEMPLATES.filter((template) => template.category === category).map((template) => (
                  <article key={template.slug} id={template.slug} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{template.category}</span>
                      <div className="flex items-center gap-1.5">
                        {LEGAL_REVIEW_TEMPLATE_CATEGORIES.has(template.category) && (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Legal review
                          </span>
                        )}
                        <span className="text-xs font-semibold text-blue-700">{template.formats.join(", ").toUpperCase()}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-navy-900">{template.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 flex-1">{template.description}</p>
                    {template.variants?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {template.variants.map((variant) => (
                          <span key={variant} className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            <span className="inline-flex h-3.5 w-5 items-center justify-center rounded bg-blue-200 text-[8px] font-bold text-blue-800">{VARIANT_CODE[variant] ?? "GL"}</span>
                            {VARIANT_LABELS[variant]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500 w-fit">
                          <span className="inline-flex h-3.5 w-5 items-center justify-center rounded bg-slate-200 text-[8px] font-bold text-slate-600">GL</span>
                          Global
                        </span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-3">
                        <Link href={`/api/templates/${template.slug}/download`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                          Download
                        </Link>
                        {template.relatedTool && (
                          <Link href={`/tools#${template.relatedTool}`} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                            Related tool
                          </Link>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">v2026.05</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-mono text-2xl font-bold text-navy-900">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
