import Link from "next/link";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";
import { PublicToolPreview } from "./public-tool-preview";

export const metadata = {
  title: "HR Tools and Calculators | Atlas HR",
  description:
    "AI HR tools and calculators for job descriptions, interview questions, offers, warnings, PIPs, onboarding, payroll, salary benchmarking, pay equity, and analytics.",
};

export default function ToolsPage() {
  const categories = [...new Set(TOOLS_CONFIG.map((tool) => tool.category))];
  const previewToolSlugs = new Set(["job-description-generator", "offer-letter"]);

  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Tools and calculators</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Practical HR tools for decisions, documents, and workforce insight.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Start with a generator or calculator, then save the output into documents, workflows, reports, and employee records.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              Use tools in Atlas
            </Link>
            <Link href="#free-tool-preview" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Try free previews
            </Link>
            <Link href="/templates" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Browse templates
            </Link>
          </div>
        </div>
      </section>

      <PublicToolPreview />

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-2xl font-bold text-navy-900">{category}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {TOOLS_CONFIG.filter((tool) => tool.category === category).map((tool) => (
                  <article key={tool.slug} id={tool.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {tool.toolType === "calculator" ? "Calculator" : "AI tool"}
                      </span>
                      <span className="text-xs text-slate-400">{tool.inputs.length} inputs</span>
                    </div>
                    <h3 className="text-base font-bold text-navy-900">{tool.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
                    <Link
                      href={previewToolSlugs.has(tool.slug) ? "#free-tool-preview" : "/sign-up"}
                      className="mt-5 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      {previewToolSlugs.has(tool.slug) ? "Use free preview" : "Open in Atlas"}
                    </Link>
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
