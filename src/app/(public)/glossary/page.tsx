import { glossary } from "@/lib/glossary";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata = {
  title: "HR Glossary | Atlas HR",
  description:
    "Plain-English definitions for HR, payroll, compliance, recruiting, employee relations, performance, and people operations terms.",
};

export default function GlossaryPage() {
  const categories = [...new Set(glossary.map((entry) => entry.category))].sort();

  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Glossary</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Plain-English HR definitions for faster manager and founder decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Use the glossary to clarify terms before creating policies, documents, analytics, or employee communications.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric value={glossary.length.toString()} label="definitions" />
            <Metric value={categories.length.toString()} label="categories" />
            <Metric value="Plain English" label="writing standard" />
          </div>

          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-2xl font-bold text-navy-900">{category}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {glossary
                  .filter((entry) => entry.category === category)
                  .map((entry) => (
                    <article key={entry.term} id={entry.term.toLowerCase().replace(/\s+/g, "-")} className="rounded-xl border border-slate-200 bg-white p-5">
                      <h3 className="text-base font-bold text-navy-900">{entry.term}</h3>
                      {entry.fullName && entry.fullName !== entry.term && (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.fullName}</p>
                      )}
                      <p className="mt-3 text-sm leading-6 text-slate-600">{entry.definition}</p>
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
