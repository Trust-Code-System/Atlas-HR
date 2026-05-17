import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Onboarding Templates | Atlas HR" };

const TYPE_STYLE: Record<string, string> = {
  onboarding:  "bg-blue-50 text-blue-700 border border-blue-200",
  offboarding: "bg-amber-50 text-amber-700 border border-amber-200",
};

const typeLabels: Record<string, string> = {
  onboarding:  "Onboarding",
  offboarding: "Offboarding",
};

export default async function TemplatesPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/onboarding");

  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("lifecycle_templates")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .order("created_at", { ascending: false });

  const allTemplates = templates ?? [];

  const templateIds = allTemplates.map((t) => t.id);
  const { data: tasks } = templateIds.length
    ? await supabase
        .from("lifecycle_template_tasks")
        .select("template_id")
        .in("template_id", templateIds)
    : { data: [] };

  const taskCountMap: Record<string, number> = {};
  for (const t of tasks ?? []) {
    taskCountMap[t.template_id] = (taskCountMap[t.template_id] ?? 0) + 1;
  }

  const onboardingCount  = allTemplates.filter((t) => t.type === "onboarding").length;
  const offboardingCount = allTemplates.filter((t) => t.type === "offboarding").length;
  const activeCount      = allTemplates.filter((t) => t.is_active).length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                <Link href="/onboarding" className="hover:text-white transition-colors">Onboarding</Link>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-blue-300">Templates</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Onboarding Templates</h1>
              <p className="text-blue-300 text-sm mt-0.5">
                Reusable checklists ·
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-400/30">
                    {activeCount} active
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link href="/onboarding/templates/new"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New template
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      {allTemplates.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Onboarding",  value: onboardingCount,  strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "Offboarding", value: offboardingCount, strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
            { label: "Active",      value: activeCount,      strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((k) => (
            <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm">
              <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                </svg>
              </div>
              <p className="font-mono text-2xl font-semibold leading-none tracking-tight text-navy-950">{k.value}</p>
              <p className="mt-1.5 text-xs font-semibold text-navy-700">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Template list */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {allTemplates.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-6">Template</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Tasks</div>
              <div className="col-span-2">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allTemplates.map((tmpl) => (
                <div key={tmpl.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-navy-50/40 transition-colors">
                  <div className="col-span-6 min-w-0">
                    <p className="text-sm font-semibold text-navy-800 truncate">{tmpl.name}</p>
                    {tmpl.description && (
                      <p className="text-xs text-navy-400 mt-0.5 truncate">{tmpl.description}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLE[tmpl.type] ?? TYPE_STYLE.onboarding}`}>
                      {typeLabels[tmpl.type] ?? tmpl.type}
                    </span>
                  </div>
                  <div className="col-span-2 font-mono text-sm font-semibold text-navy-700">
                    {taskCountMap[tmpl.id] ?? 0}
                  </div>
                  <div className="col-span-2">
                    {tmpl.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-navy-100 text-navy-500 border border-navy-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No templates yet</h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">Create a template to define the checklist for new hires or departing employees.</p>
            <Link href="/onboarding/templates/new"
              className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New template
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
