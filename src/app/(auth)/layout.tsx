import Link from "next/link";
import { AtlasLogo } from "@/components/atlas-logo";

const trustSignals = [
  "Consent-gated analytics",
  "Role-based workspace access",
  "Country-aware HR workflows",
];

const workflowSteps = [
  { label: "Hire", value: "Contract checks" },
  { label: "Onboard", value: "Documents and tasks" },
  { label: "Manage", value: "Audit-ready records" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7faff] text-navy-950">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-linear-to-b from-white via-blue-50/80 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-blue-100/70 via-blue-50/30 to-transparent" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <AtlasLogo
            markClassName="h-9 w-9 transition-transform group-hover:scale-105"
            textClassName="text-xl"
          />
        </Link>
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-sm font-medium text-navy-500 transition-colors hover:bg-white hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 pb-8 pt-4 sm:px-6 lg:min-h-[calc(100vh-152px)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:items-center lg:px-8 lg:pb-10">
        <section className="hidden overflow-hidden rounded-3xl border border-white/10 bg-navy-950 text-white shadow-2xl shadow-blue-950/20 lg:block">
          <div className="relative min-h-[660px] p-10">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.38),transparent_46%,rgba(14,165,233,0.18))]" />
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-navy-950 to-transparent" />
            </div>

            <div className="relative flex h-full min-h-[580px] flex-col justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-200">
                  Atlas HR workspace
                </p>
                <h1 className="mt-5 max-w-xl text-5xl font-bold leading-[1.02] tracking-tight">
                  Global HR records, workflows, and compliance in one secured workspace.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/85">
                  Built for teams hiring across Nigeria, India, the UK, and the US without spreading sensitive employee data across disconnected tools.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                <div className="rounded-2xl border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Workspace readiness</p>
                      <p className="mt-1 text-xs text-blue-100/75">Security, privacy, and country context stay visible.</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/25">
                      Secure by design
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {trustSignals.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-blue-50">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-400/20 text-xs font-bold text-blue-100 ring-1 ring-blue-200/20">
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {workflowSteps.map((step) => (
                    <div key={step.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">{step.label}</p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-white">{step.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-180px)] items-center justify-center py-4 lg:min-h-0 lg:py-0">
          {children}
        </section>
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-navy-400">
        &copy; {new Date().getFullYear()} Atlas HR &middot;{" "}
        <Link href="/privacy" className="hover:text-navy-600 transition-colors">
          Privacy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className="hover:text-navy-600 transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}
