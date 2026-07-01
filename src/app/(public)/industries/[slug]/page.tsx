import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/templates-data";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { INDUSTRY_HUBS, getIndustryHub } from "@/lib/public-resource-data";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export function generateStaticParams() {
  return INDUSTRY_HUBS.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustryHub(slug);
  if (!industry) return {};
  return {
    title: `${industry.name} HR Guide | Atlas HR`,
    description: industry.summary,
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustryHub(slug);
  if (!industry) notFound();

  const templates = industry.templateSlugs
    .map((templateSlug) => TEMPLATES.find((template) => template.slug === templateSlug))
    .filter(Boolean);
  const tools = industry.toolSlugs
    .map((toolSlug) => TOOLS_CONFIG.find((tool) => tool.slug === toolSlug))
    .filter(Boolean);

  return (
    <div className="bg-slate-50 text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/industries" className="text-sm font-semibold text-blue-300 hover:text-blue-100">Industries</Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-5xl">{industry.name} HR guide</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-navy-200">{industry.summary}</p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">Pressure points</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {industry.pressurePoints.map((point) => (
                  <div key={point} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                    {point}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-bold text-amber-950">How Atlas makes this operational</h2>
              <p className="mt-3 text-sm leading-6 text-amber-900">
                Pair this industry guide with templates, calculators, workflow bundles, and employee records so HR teams can move from advice to execution without rebuilding the process each time.
              </p>
            </section>
          </main>

          <aside className="space-y-5">
            <ResourceBox title="Templates">
              {templates.map((template) => (
                <Link key={template!.slug} href={`/templates#${template!.slug}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 hover:border-blue-300">
                  {template!.name}
                </Link>
              ))}
            </ResourceBox>
            <ResourceBox title="Tools">
              {tools.map((tool) => (
                <Link key={tool!.slug} href={`/tools#${tool!.slug}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 hover:border-blue-300">
                  {tool!.name}
                </Link>
              ))}
            </ResourceBox>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ResourceBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
