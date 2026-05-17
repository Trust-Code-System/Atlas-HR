import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/templates-data";
import { TOOLS_CONFIG } from "@/lib/tools-config";
import { WORKFLOW_BUNDLES, getWorkflowBundle, getWorkflowLaunchTarget } from "@/lib/public-resource-data";
import { launchWorkflowRun } from "../actions";

export function generateStaticParams() {
  return WORKFLOW_BUNDLES.map((workflow) => ({ slug: workflow.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workflow = getWorkflowBundle(slug);
  if (!workflow) return {};
  return {
    title: `${workflow.title} | Atlas HR Workflow`,
    description: workflow.summary,
  };
}

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workflow = getWorkflowBundle(slug);
  if (!workflow) notFound();

  const templates = workflow.templateSlugs
    .map((templateSlug) => TEMPLATES.find((template) => template.slug === templateSlug))
    .filter(Boolean);
  const tools = workflow.toolSlugs
    .map((toolSlug) => TOOLS_CONFIG.find((tool) => tool.slug === toolSlug))
    .filter(Boolean);
  const launch = getWorkflowLaunchTarget(workflow.slug);

  return (
    <div className="bg-slate-50 text-navy-900">
      <section className="bg-navy-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/workflows" className="text-sm font-semibold text-blue-300 hover:text-blue-100">Workflows</Link>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-5xl">{workflow.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-navy-200">{workflow.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-100">{workflow.intent}</span>
            {workflow.countryAware && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">Country-aware</span>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
          <main className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">Workflow steps</h2>
              <ol className="mt-5 space-y-4">
                {workflow.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">Saved actions Atlas should create</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {workflow.savedActions.map((action) => (
                  <div key={action} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                    {action}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-bold text-amber-950">When to call counsel</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                {workflow.whenToCallCounsel.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          </main>

          <aside className="space-y-5">
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700">Launch in Atlas</h2>
              <p className="mt-3 text-sm leading-6 text-blue-900">{launch.note}</p>
              <div className="mt-4 flex flex-col gap-2">
                <form action={launchWorkflowRun}>
                  <input type="hidden" name="workflow_slug" value={workflow.slug} />
                  <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
                    Create workflow run
                  </button>
                </form>
                <Link href={launch.href} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
                  {launch.label}
                </Link>
                {launch.secondaryHref && launch.secondaryLabel && (
                  <Link href={launch.secondaryHref} className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100">
                    {launch.secondaryLabel}
                  </Link>
                )}
              </div>
            </section>
            <ResourceBox title="Templates in this workflow">
              {templates.map((template) => (
                <Link key={template!.slug} href={`/templates#${template!.slug}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 hover:border-blue-300">
                  {template!.name}
                </Link>
              ))}
            </ResourceBox>
            <ResourceBox title="Tools in this workflow">
              {tools.map((tool) => (
                <Link key={tool!.slug} href={`/tools#${tool!.slug}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 hover:border-blue-300">
                  {tool!.name}
                </Link>
              ))}
            </ResourceBox>
            <ResourceBox title="Trust signals">
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {workflow.trustSignals.map((signal) => (
                  <li key={signal}>- {signal}</li>
                ))}
              </ul>
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
