import Link from "next/link";
import { WORKFLOW_BUNDLES, getWorkflowLaunchTarget } from "@/lib/public-resource-data";
import { launchWorkflowRun } from "./actions";
import { PublicHeroBg } from "@/components/landing/public-hero-bg";

export const metadata = {
  title: "HR Workflow Bundles | Atlas HR",
  description:
    "Flagship HR workflow pages for offer letters, termination, onboarding, PIPs, leave policies, handbooks, payroll, reviews, warnings, and country-specific contracts.",
};

export default function WorkflowsPage() {
  return (
    <div className="text-navy-900">
      <section className="relative overflow-hidden bg-navy-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <PublicHeroBg />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">Workflow bundles</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            High-intent HR jobs packaged as guides, templates, tools, and saved actions.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            This is where Atlas moves beyond static articles: each workflow shows the guide, document, approval trail, employee record, audit trail, and legal review checkpoint.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {WORKFLOW_BUNDLES.map((workflow) => (
            <article key={workflow.slug} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {workflow.countryAware ? "Country-aware" : "Global workflow"}
                </span>
                <span className="text-xs text-slate-400">{workflow.steps.length} steps</span>
              </div>
              <h2 className="text-xl font-bold text-navy-900">{workflow.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{workflow.summary}</p>
              <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
                <Link href={`/workflows/${workflow.slug}`} className="inline-flex h-8 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">
                  Open workflow
                </Link>
                <form action={launchWorkflowRun} className="inline-flex">
                  <input type="hidden" name="workflow_slug" value={workflow.slug} />
                  <button type="submit" className="inline-flex h-8 items-center text-sm font-semibold text-slate-600 hover:text-slate-900">
                    Create run
                  </button>
                </form>
                <Link href={getWorkflowLaunchTarget(workflow.slug).href} className="inline-flex h-8 items-center text-sm font-semibold text-slate-600 hover:text-slate-900">
                  Open target
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
