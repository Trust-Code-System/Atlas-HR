import Link from "next/link";
import { COUNTRY_HUBS } from "@/lib/public-resource-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata = {
  title: "Country HR Hubs | Atlas HR",
  description:
    "Country-specific HR hubs for Nigeria, India, the United Kingdom, and the United States with leave, payroll, contracts, notice, termination, and document guidance.",
};

export default function CountriesPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Country HR hubs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Country-aware HR operations for global and global-south teams.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            Each hub connects local guidance to templates, payroll checkpoints, termination workflows, required records, and "when to call counsel" notes.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          {COUNTRY_HUBS.map((country) => (
            <Link key={country.slug} href={`/countries/${country.slug}`} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{country.name}</p>
              <h2 className="mt-3 text-2xl font-bold text-navy-900">{country.headline}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{country.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{country.variant.toUpperCase()} template variant</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Legal review recommended</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
