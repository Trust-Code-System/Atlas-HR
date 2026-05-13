import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileWarning, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { recomputeCurrentWorkspaceCompliance, sendDocumentReminder, updateRequirement } from "./actions";

type GapRow = {
  employee_id: string;
  employee_name: string;
  employee_email: string | null;
  doc_type: string;
  status: "missing" | "submitted" | "expired" | "expiring_soon" | "approved";
  display_name: string;
  legal_basis: string | null;
  knowledge_article_slug: string | null;
  current_document_id: string | null;
};

const STATUS_STYLES = {
  missing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  expiring_soon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  submitted: "bg-accent-soft text-accent",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function statusLabel(status: GapRow["status"]) {
  return status.replace(/_/g, " ");
}

function knowledgeHref(slug: string) {
  const countryMap: Record<string, string> = {
    nigeria: "nigeria",
    "united-states": "united-states",
    "united-kingdom": "united-kingdom",
    india: "india",
  };
  return countryMap[slug] ? `/knowledge/country/${countryMap[slug]}` : "/knowledge";
}

export default async function ComplianceCenterPage() {
  const ctx = await getCurrentOrg();
  if (!ctx) redirect("/sign-in");
  if (!ctx.roles.includes("workspace_owner") && !ctx.roles.includes("hr_admin") && !ctx.roles.includes("hr_manager")) {
    redirect("/workspace/people");
  }

  const supabase = await createClient();
  const [{ data: employees }, { data: templates }] = await Promise.all([
    supabase.from("employees").select("id, full_name, email, status").eq("org_id", ctx.org.id).order("full_name"),
    supabase
      .from("document_requirement_templates")
      .select("id, name, description")
      .eq("org_id", ctx.org.id)
      .eq("is_active", true),
  ]);

  const templateIds = (templates ?? []).map((template) => template.id);
  const { data: requirementRows } =
    templateIds.length > 0
      ? await supabase
          .from("document_requirements")
          .select("id, template_id, doc_type, display_name, is_required, expiry_required, expiry_warning_days, legal_basis, knowledge_article_slug")
          .in("template_id", templateIds)
      : { data: [] };

  const employeeRows = employees ?? [];
  const employeeIds = employeeRows.map((employee) => employee.id);
  const { data: statuses } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_document_status")
          .select("employee_id, doc_type, status, current_document_id")
          .in("employee_id", employeeIds)
      : { data: [] };

  const requirements = requirementRows ?? [];
  const requirementMap = new Map(requirements.map((requirement) => [requirement.doc_type, requirement]));
  const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee]));

  const statusRows = (statuses ?? []) as { employee_id: string; doc_type: string; status: GapRow["status"]; current_document_id: string | null }[];
  const total = statusRows.length;
  const compliant = statusRows.filter((row) => row.status === "approved").length;
  const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const gaps: GapRow[] = statusRows
    .filter((row) => row.status !== "approved")
    .map((row) => {
      const employee = employeeMap.get(row.employee_id);
      const requirement = requirementMap.get(row.doc_type);
      return {
        employee_id: row.employee_id,
        employee_name: employee?.full_name ?? "Unknown employee",
        employee_email: employee?.email ?? null,
        doc_type: row.doc_type,
        status: row.status,
        display_name: requirement?.display_name ?? row.doc_type.replace(/_/g, " "),
        legal_basis: requirement?.legal_basis ?? null,
        knowledge_article_slug: requirement?.knowledge_article_slug ?? null,
        current_document_id: row.current_document_id,
      };
    })
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

  const byDocType = Object.entries(
    gaps.reduce<Record<string, number>>((acc, gap) => {
      acc[gap.display_name] = (acc[gap.display_name] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-medium text-[--accent]">{ctx.org.name}</p>
          <h1 className="mt-1 text-3xl font-bold text-[--text-primary]">Compliance center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[--text-secondary]">
            Track missing and expiring employee documents, policy acknowledgments, and the legal context behind each requirement.
          </p>
        </div>
        <form action={recomputeCurrentWorkspaceCompliance}>
          <button className="flex items-center gap-2 rounded-lg border border-[--border] px-3 py-2 text-sm font-semibold text-[--text-primary] hover:bg-[--bg-hover]">
            <RefreshCw size={14} /> Recompute
          </button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--accent-soft] text-[--accent]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-[--text-secondary]">Compliance score</p>
              <p className="text-3xl font-bold text-[--text-primary]">{score}%</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[--bg-hover]">
            <div className="h-full rounded-full bg-[--accent]" style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <p className="text-2xl font-bold text-[--text-primary]">{gaps.filter((gap) => gap.status === "missing").length}</p>
          <p className="mt-1 text-sm text-[--text-secondary]">Missing</p>
        </div>
        <div className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <p className="text-2xl font-bold text-[--text-primary]">{gaps.filter((gap) => gap.status === "expired" || gap.status === "expiring_soon").length}</p>
          <p className="mt-1 text-sm text-[--text-secondary]">Expired or expiring</p>
        </div>
      </section>

      <section className="rounded-xl border border-[--border] bg-[--bg-card]">
        <div className="border-b border-[--border] px-5 py-4">
          <h2 className="font-semibold text-[--text-primary]">All compliance gaps</h2>
          <p className="mt-1 text-xs text-[--text-tertiary]">Sorted by employee. Use reminders to nudge linked portal users.</p>
        </div>
        <div className="divide-y divide-[--border]">
          {gaps.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-[--text-secondary]">
              <CheckCircle2 size={18} className="text-emerald-500" /> No compliance gaps after the latest computation.
            </div>
          ) : (
            gaps.map((gap) => (
              <div key={`${gap.employee_id}-${gap.doc_type}`} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_180px_160px] lg:items-center">
                <div className="min-w-0">
                  <Link href={`/workspace/people/${gap.employee_id}`} className="font-medium text-[--text-primary] hover:text-[--accent]">
                    {gap.employee_name}
                  </Link>
                  <p className="mt-1 text-sm text-[--text-secondary]">{gap.display_name}</p>
                  {gap.legal_basis && <p className="mt-1 text-xs leading-5 text-[--text-tertiary]">{gap.legal_basis}</p>}
                  {gap.knowledge_article_slug && (
                    <Link href={knowledgeHref(gap.knowledge_article_slug)} className="mt-1 inline-flex text-xs font-medium text-[--accent] hover:underline">
                      Learn more
                    </Link>
                  )}
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[gap.status]}`}>
                  {statusLabel(gap.status)}
                </span>
                <form action={sendDocumentReminder}>
                  <input type="hidden" name="employee_id" value={gap.employee_id} />
                  <input type="hidden" name="doc_type" value={gap.doc_type} />
                  <button className="flex items-center gap-2 rounded-lg border border-[--border] px-3 py-2 text-sm text-[--text-secondary] hover:bg-[--bg-hover]">
                    <Send size={13} /> Send reminder
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileWarning size={18} className="text-[--accent]" />
            <h2 className="font-semibold text-[--text-primary]">By document type</h2>
          </div>
          <div className="space-y-3">
            {byDocType.length === 0 ? (
              <p className="text-sm text-[--text-tertiary]">No document-type gaps.</p>
            ) : (
              byDocType.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[--text-secondary]">{name}</span>
                    <span className="font-medium text-[--text-primary]">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[--bg-hover]">
                    <div className="h-full rounded-full bg-[--accent]" style={{ width: `${Math.min(100, count * 12)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[--border] bg-[--bg-card] p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-[--accent]" />
            <h2 className="font-semibold text-[--text-primary]">Requirement templates</h2>
          </div>
          <div className="space-y-4">
            {(templates ?? []).map((template) => (
              <div key={template.id} className="rounded-lg border border-[--border] p-3">
                <p className="font-medium text-[--text-primary]">{template.name}</p>
                <p className="mt-1 text-xs text-[--text-tertiary]">{template.description}</p>
                <div className="mt-3 space-y-2">
                  {requirements.filter((requirement) => requirement.template_id === template.id).slice(0, 6).map((requirement) => (
                    <form key={requirement.id} action={updateRequirement} className="grid gap-2 rounded-lg bg-[--bg-app] p-2 md:grid-cols-[minmax(0,1fr)_70px_80px]">
                      <input type="hidden" name="requirement_id" value={requirement.id} />
                      <input name="display_name" defaultValue={requirement.display_name} className="rounded-md border border-[--border] bg-[--bg-input] px-2 py-1 text-xs text-[--text-primary]" />
                      <input name="expiry_warning_days" defaultValue={requirement.expiry_warning_days ?? 30} className="rounded-md border border-[--border] bg-[--bg-input] px-2 py-1 text-xs text-[--text-primary]" />
                      <label className="flex items-center gap-1 text-xs text-[--text-secondary]">
                        <input type="checkbox" name="is_required" defaultChecked={requirement.is_required ?? true} />
                        Required
                      </label>
                      <button className="md:col-span-3 w-fit rounded-md border border-[--border] px-2 py-1 text-xs text-[--text-secondary] hover:bg-[--bg-hover]">Save</button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
