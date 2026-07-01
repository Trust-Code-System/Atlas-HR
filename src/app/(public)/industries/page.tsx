import Link from "next/link";
import { INDUSTRY_HUBS } from "@/lib/public-resource-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata = {
  title: "HR Industry Guides | Atlas HR",
  description:
    "Industry-specific HR guidance for technology, healthcare, manufacturing, and retail teams.",
};

export default function IndustriesPage() {
  return (
    <div className="bg-slate-50 text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Industry guides</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            HR playbooks shaped around how each workforce actually operates.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Start with industry pressure points, then connect to the templates, tools, and workflows most likely to matter.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          {INDUSTRY_HUBS.map((industry) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{industry.name}</p>
              <h2 className="mt-3 text-2xl font-bold text-navy-900">{industry.summary}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {industry.pressurePoints.slice(0, 3).map((point) => (
                  <span key={point} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {point}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
