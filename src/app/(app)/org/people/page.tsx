import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "People | Atlas HR" };

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  active:     { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  on_leave:   { pill: "bg-amber-50 text-amber-700 border border-amber-200",       dot: "bg-amber-400" },
  terminated: { pill: "bg-red-50 text-red-700 border border-red-200",             dot: "bg-red-500" },
};

const DEPT_GRADS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-indigo-500 to-blue-600",
];

function deptGrad(dept: string | null): string {
  if (!dept) return DEPT_GRADS[0];
  let h = 0;
  for (let i = 0; i < dept.length; i++) h = dept.charCodeAt(i) + ((h << 5) - h);
  return DEPT_GRADS[Math.abs(h) % DEPT_GRADS.length];
}

export default async function PeoplePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const { org, isAdmin } = orgData;
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("org_id", org.id)
    .order("full_name", { ascending: true });

  const list = employees ?? [];
  const active  = list.filter((e) => e.status === "active").length;
  const onLeave = list.filter((e) => e.status === "on_leave").length;
  const depts   = new Set(list.map((e) => e.department).filter(Boolean)).size;

  const kpis = [
    { label: "Total employees", value: list.length, strip: "from-blue-400 to-blue-600",    grad: "from-blue-500 to-blue-700",    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Active",          value: active,       strip: "from-emerald-400 to-teal-500", grad: "from-emerald-500 to-teal-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "On leave",        value: onLeave,      strip: "from-amber-400 to-orange-500", grad: "from-amber-500 to-orange-600", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Departments",     value: depts,        strip: "from-violet-400 to-purple-500",grad: "from-violet-500 to-purple-600",icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">People</h1>
              <p className="text-blue-300 text-sm mt-0.5">{org.name} · {list.length} employee{list.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/org/people/import"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
              </Link>
              <Link
                href="/org/people/new"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors ring-1 ring-white/15"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add employee
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col overflow-hidden rounded-[18px] border border-navy-200 bg-white p-4 pt-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${k.strip}`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${k.grad} text-white shadow-sm`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
              </svg>
            </div>
            <p className="font-mono text-3xl font-semibold leading-none tracking-tight text-navy-950 tabular-nums">{k.value}</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-700">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Employee table */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {list.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-4">Name</div>
              <div className="col-span-3 hidden md:block">Job title</div>
              <div className="col-span-3 hidden sm:block">Department</div>
              <div className="col-span-2">Status</div>
            </div>
            <div className="divide-y divide-navy-100">
              {list.map((emp) => {
                const ss = STATUS_STYLE[emp.status] ?? STATUS_STYLE.active;
                const grad = deptGrad(emp.department);
                return (
                  <Link
                    key={emp.id}
                    href={`/org/people/${emp.id}`}
                    className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-blue-50/40 transition-colors group items-center"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {emp.photo_url ? (
                        <Avatar name={emp.full_name} src={emp.photo_url} size="sm" />
                      ) : (
                        <div className={`h-9 w-9 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
                          {emp.full_name?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate group-hover:text-blue-700 transition-colors">
                          {emp.full_name}
                        </p>
                        <p className="text-xs text-navy-400 truncate">{emp.email}</p>
                      </div>
                    </div>
                    <div className="col-span-3 hidden md:block text-sm text-navy-600 truncate">
                      {emp.job_title ?? <span className="text-navy-300">—</span>}
                    </div>
                    <div className="col-span-3 hidden sm:block">
                      {emp.department ? (
                        <span className="inline-flex items-center text-xs font-medium text-navy-600 bg-navy-50 border border-navy-100 px-2.5 py-1 rounded-full max-w-full truncate">
                          {emp.department}
                        </span>
                      ) : (
                        <span className="text-navy-300 text-sm">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${ss.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${ss.dot}`} />
                        {emp.status?.replace("_", " ") ?? "active"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No employees yet</h3>
            <p className="text-sm text-navy-500 mb-6 max-w-xs mx-auto">
              {isAdmin ? "Add your first employee to get started." : "No employees have been added yet."}
            </p>
            {isAdmin && (
              <Link href="/org/people/new"
                className="inline-flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add first employee
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
