import { getUser } from "@/lib/auth/get-user";
import { getPublishedComplianceUpdates } from "@/lib/compliance-data";
import { ComplianceClient } from "./compliance-client";

export const metadata = {
  title: "HR Compliance Change Tracker | Atlas HR",
  description:
    "Plain-English HR compliance updates — what changed, who is affected, and what to do next — for Nigeria, India, the UK, and the US.",
};

export default async function ComplianceUpdatesPage() {
  const [user, updates] = await Promise.all([
    getUser(),
    Promise.resolve(getPublishedComplianceUpdates()),
  ]);

  const prefs = (user?.notification_preferences as Record<string, unknown>) ?? {};
  const subscriptions = (prefs.compliance_jurisdictions as string[]) ?? [];

  return (
    <div className="bg-slate-50 text-navy-900">
      <section className="bg-navy-900 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Compliance change tracker
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            What changed, who is affected, and what HR should do next.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-navy-200">
            A plain-English tracker for Nigeria, India, the United Kingdom, and the United States.
            Subscribe to jurisdictions to get notified when we publish new updates.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-red-200">
              Critical
            </span>
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-amber-200">
              Action needed
            </span>
            <span className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-blue-200">
              Review recommended
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-navy-200">
              Monitoring
            </span>
          </div>
        </div>
      </section>

      <ComplianceClient
        updates={updates}
        isLoggedIn={!!user}
        initialSubscriptions={subscriptions}
      />
    </div>
  );
}
