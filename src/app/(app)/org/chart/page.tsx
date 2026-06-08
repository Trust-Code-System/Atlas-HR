import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Org Chart | Atlas HR" };

type EmpRow = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  manager_id: string | null;
  status: "active" | "on_leave" | "terminated";
  is_department_head: boolean | null;
};

type TreeNode = EmpRow & { reports: TreeNode[] };

const DEPT_GRADS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
];

function deptGrad(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return DEPT_GRADS[Math.abs(h) % DEPT_GRADS.length];
}

function buildTree(employees: EmpRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const e of employees) map.set(e.id, { ...e, reports: [] });
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (!node.manager_id || !map.has(node.manager_id)) roots.push(node);
    else map.get(node.manager_id)!.reports.push(node);
  }
  return roots.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

function sortReports(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if ((a.is_department_head ?? false) !== (b.is_department_head ?? false)) return a.is_department_head ? -1 : 1;
      return a.full_name.localeCompare(b.full_name);
    })
    .map((n) => ({ ...n, reports: sortReports(n.reports) }));
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const statusDot: Record<string, string> = {
  active:     "bg-blue-500",
  on_leave:   "bg-amber-400",
  terminated: "bg-red-400",
};

function EmployeeCard({ node }: { node: TreeNode }) {
  const grad = deptGrad(node.full_name);
  return (
    <Link
      href={`/org/people/${node.id}`}
      className="group flex items-center gap-3 bg-white border border-navy-200 rounded-2xl px-4 py-3 hover:border-blue-300 hover:shadow-md transition-all w-[188px] min-h-19"
    >
      <div className="relative shrink-0">
        <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
          {initials(node.full_name)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot[node.status] ?? "bg-navy-300"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-blue-700 transition-colors leading-tight">
          {node.full_name}
        </p>
        {node.job_title && <p className="text-xs text-navy-500 truncate mt-0.5">{node.job_title}</p>}
        {node.is_department_head && (
          <span className="mt-1 inline-flex text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
            Head
          </span>
        )}
      </div>
    </Link>
  );
}

function OrgNode({ node }: { node: TreeNode }) {
  const childCount = node.reports.length;
  return (
    <div className="flex flex-col items-center">
      <EmployeeCard node={node} />

      {childCount > 0 && (
        <>
          {/* Vertical drop from card */}
          <div className="w-0.5 h-5 bg-navy-200" />

          {/* Children row */}
          <div className="flex">
            {node.reports.map((child, i) => (
              <div key={child.id} className="relative flex flex-col items-center px-4 pt-5">
                {/* Horizontal connector segment */}
                {childCount > 1 && (
                  <div
                    className={`absolute top-0 h-0.5 bg-navy-200 ${
                      i === 0
                        ? "left-1/2 right-0"
                        : i === childCount - 1
                          ? "left-0 right-1/2"
                          : "inset-x-0"
                    }`}
                  />
                )}
                {/* Vertical stub from horizontal bar to child card */}
                <div className="absolute top-0 left-1/2 -translate-x-px w-0.5 h-5 bg-navy-200" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, job_title, department, manager_id, status, is_department_head")
    .eq("org_id", orgCtx.org.id)
    .neq("status", "terminated")
    .order("full_name");

  const allEmployees: EmpRow[] = employees ?? [];
  const rawRoots = buildTree(allEmployees);
  const roots = sortReports(rawRoots);

  const totalActive  = allEmployees.filter((e) => e.status === "active").length;
  const totalOnLeave = allEmployees.filter((e) => e.status === "on_leave").length;

  const deptMap = new Map<string, EmpRow[]>();
  for (const e of allEmployees) {
    const dept = e.department ?? "Unassigned";
    if (!deptMap.has(dept)) deptMap.set(dept, []);
    deptMap.get(dept)!.push(e);
  }

  return (
    <div className="p-6 lg:p-8 max-w-full mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Org Chart</h1>
              <p className="text-blue-300 text-sm mt-0.5 flex items-center gap-3">
                {orgCtx.org.name}
                <span className="inline-flex items-center gap-1 text-blue-200 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{totalActive} active
                </span>
                {totalOnLeave > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-300 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{totalOnLeave} on leave
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/org/people/new"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add employee
          </Link>
        </div>
      </div>

      {allEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-200 p-16 text-center shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">No employees yet</h3>
          <p className="text-sm text-navy-500 mb-4">Add your first employee to start building your org chart.</p>
          <Link href="/org/people/new"
            className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:shadow-md transition-all">
            Add first employee
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Horizontal tree */}
          <div className="bg-white rounded-2xl border border-navy-200 p-6 overflow-x-auto shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <h2 className="font-bold text-navy-900 text-sm">Reporting structure</h2>
                <p className="mt-1 text-xs text-navy-500">
                  New employees can be auto-placed by Atlas AI when their manager is blank. HR can still edit every reporting line manually.
                </p>
              </div>
              <Link
                href="/org/people"
                className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                Edit people
              </Link>
            </div>
            <div className="min-w-max pb-4">
              {roots.length === 1 ? (
                <OrgNode node={roots[0]} />
              ) : (
                <div className="flex gap-10">
                  {roots.map((root) => (
                    <OrgNode key={root.id} node={root} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
            {/* Department summary */}
            <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-navy-900 text-sm">By department</h2>
                  <p className="mt-1 text-xs text-navy-500">Department heads and team counts shown below the organogram.</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {deptMap.size} departments
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                {[...deptMap.entries()]
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([dept, members]) => {
                    const head = members.find((m) => m.is_department_head);
                    const grad = deptGrad(dept);
                    return (
                      <div key={dept} className="flex items-start gap-3 rounded-2xl border border-navy-100 bg-navy-50/40 p-3">
                        <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center shrink-0`}>
                          <span className="text-sm font-bold text-white">{dept[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-800 truncate">{dept}</p>
                          <p className="text-xs text-navy-400 truncate">
                            {head ? `Head: ${head.full_name}` : "No department head set"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-navy-600 bg-white border border-navy-200 rounded-full px-2 py-0.5">
                          {members.length}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Atlas AI placement</h3>
                <p className="text-sm text-navy-700 leading-relaxed">
                  When a new employee is created without a selected manager, Atlas places them under the department head,
                  then a likely manager or lead. Choose a manager manually anytime to override it.
                </p>
              </div>

              {/* Legend */}
              <div className="bg-navy-50 rounded-2xl border border-navy-100 p-5">
                <h3 className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-3">Legend</h3>
                <div className="space-y-2.5">
                {[
                  { color: "bg-blue-500",  label: "Active" },
                  { color: "bg-amber-400", label: "On leave" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="text-xs text-navy-600">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">Head</span>
                  <span className="text-xs text-navy-600">Department head</span>
                </div>
                </div>
                <p className="text-xs text-navy-400 mt-4">Click any card to view employee profile and edit reporting lines.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
