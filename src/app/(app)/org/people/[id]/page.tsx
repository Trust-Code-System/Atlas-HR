import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EditEmployeeModal } from "./edit-employee-modal";
import { AiSummaryButton } from "@/components/ai/ai-summary-button";
import type { Metadata } from "next";
import { dataOrEmpty } from "@/lib/supabase/schema";
import type { AssetAssignment, CompanyAsset } from "@/types/database";

export const metadata: Metadata = { title: "Employee Profile | Atlas HR" };

const STATUS_VISUAL: Record<string, { pill: string; dot: string; strip: string; grad: string }> = {
  active:     { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", strip: "from-emerald-400 to-teal-500",  grad: "from-emerald-500 to-teal-600" },
  on_leave:   { pill: "bg-amber-50 text-amber-700 border border-amber-200",       dot: "bg-amber-400",   strip: "from-amber-400 to-orange-500",  grad: "from-amber-500 to-orange-600" },
  terminated: { pill: "bg-red-50 text-red-700 border border-red-200",             dot: "bg-red-500",     strip: "from-red-400 to-rose-500",      grad: "from-red-500 to-rose-600" },
};

const LEAVE_STATUS: Record<string, { pill: string }> = {
  approved: { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  rejected: { pill: "bg-red-50 text-red-700 border border-red-200" },
  pending:  { pill: "bg-amber-50 text-amber-700 border border-amber-200" },
};

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract:  "Contract",
  intern:    "Intern",
};

const DEPT_GRADS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

function deptGrad(dept: string | null): string {
  if (!dept) return DEPT_GRADS[0];
  let h = 0;
  for (let i = 0; i < dept.length; i++) h = dept.charCodeAt(i) + ((h << 5) - h);
  return DEPT_GRADS[Math.abs(h) % DEPT_GRADS.length];
}

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && (
          <svg className="h-3.5 w-3.5 text-navy-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
        <span className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-medium text-navy-800">{value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-navy-100 bg-navy-50/40">
        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-navy-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const { org, isAdmin } = orgData;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!employee) notFound();

  // The AI summary is for admins and the employee's manager (matches the route's auth).
  let canSummarize = isAdmin;
  if (!canSummarize) {
    const { data: managesThis } = await supabase.rpc("manages_employee", { _employee_id: id });
    canSummarize = Boolean(managesThis);
  }

  const [{ data: managerData }, { data: leaveRequests }, { data: documents }, { data: allEmployees }] =
    await Promise.all([
      employee.manager_id
        ? supabase.from("employees").select("full_name, job_title").eq("id", employee.manager_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("leave_requests").select("*").eq("employee_id", id).order("created_at", { ascending: false }).limit(10),
      supabase.from("employee_documents").select("*").eq("employee_id", id).order("created_at", { ascending: false }),
      isAdmin
        ? supabase.from("employees").select("id, full_name").eq("org_id", org.id).order("full_name")
        : Promise.resolve({ data: [] }),
    ]);

  const rawAssetAssignments = await dataOrEmpty(
    supabase
      .from("asset_assignments")
      .select("*")
      .eq("org_id", org.id)
      .eq("employee_id", id)
      .eq("assignment_status", "assigned")
      .order("assigned_at", { ascending: false }),
  );
  const assetAssignments = (rawAssetAssignments ?? []) as AssetAssignment[];
  const assetIds = assetAssignments.map((assignment) => assignment.asset_id);
  const rawEmployeeAssets = assetIds.length
    ? await dataOrEmpty(
        supabase
          .from("company_assets")
          .select("*")
          .eq("org_id", org.id)
          .in("id", assetIds),
      )
    : [];
  const assetMap = Object.fromEntries(((rawEmployeeAssets ?? []) as CompanyAsset[]).map((asset) => [asset.id, asset]));

  const fmt = (d: string | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
    d ? new Date(d).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" }) : null;

  const vis = STATUS_VISUAL[employee.status] ?? STATUS_VISUAL.active;
  const avatarGrad = deptGrad(employee.department);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-navy-400 mb-6">
        <Link href="/org/people" className="hover:text-navy-700 transition-colors">People</Link>
        <span>/</span>
        <span className="text-navy-700 font-medium">{employee.full_name}</span>
      </nav>

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 mb-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className={`absolute inset-x-0 bottom-0 h-1 bg-linear-to-r ${vis.strip}`} />

        <div className="relative px-7 py-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.full_name} className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-2 ring-white/20 shrink-0" />
            ) : (
              <div className={`h-20 w-20 rounded-2xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-white/20 shrink-0`}>
                {employee.full_name?.slice(0, 2).toUpperCase() ?? "??"}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{employee.full_name}</h1>
                  <p className="text-blue-300 text-sm mt-0.5">{employee.job_title ?? "No title set"}</p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${vis.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${vis.dot}`} />
                      {employee.status?.replace("_", " ") ?? "active"}
                    </span>
                    {employee.employment_type && (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white ring-1 ring-white/15">
                        {EMP_TYPE_LABEL[employee.employment_type] ?? employee.employment_type}
                      </span>
                    )}
                    {employee.department && (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-blue-200 ring-1 ring-white/10">
                        {employee.department}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canSummarize && (
                    <AiSummaryButton
                      endpoint={`/api/ai/profile-summary?id=${employee.id}`}
                      title="AI Profile Summary"
                      subtitle={employee.full_name}
                      buttonLabel="AI summary"
                    />
                  )}
                  {isAdmin && (
                    <EditEmployeeModal
                      employee={employee}
                      managers={(allEmployees ?? []) as { id: string; full_name: string }[]}
                    />
                  )}
                </div>
              </div>

              {/* Quick meta strip */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Email",      value: employee.email },
                  { label: "Phone",      value: employee.phone },
                  { label: "Country",    value: employee.country },
                  { label: "Start date", value: fmt(employee.start_date) },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-0.5">{f.label}</p>
                    <p className="text-sm font-medium text-white truncate">{f.value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Employment details */}
          <SectionCard title="Employment details" icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Job title"        value={employee.job_title} icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01" />
              <Field label="Department"       value={employee.department} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              <Field label="Employment type"  value={employee.employment_type ? EMP_TYPE_LABEL[employee.employment_type] : null} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />
              <Field label="Manager"          value={managerData?.full_name} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              <Field label="Start date"       value={fmt(employee.start_date, { day: "numeric", month: "long", year: "numeric" })} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <Field label="End date"         value={fmt(employee.end_date, { day: "numeric", month: "long", year: "numeric" })} icon="M17 16l4-4m0 0l-4-4m4 4H7" />
            </div>
          </SectionCard>

          {/* Leave history */}
          <SectionCard title="Leave history" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
            {leaveRequests && leaveRequests.length > 0 ? (
              <div className="divide-y divide-navy-100 -mx-5 px-5">
                {leaveRequests.map((req) => {
                  const start = new Date(req.start_date);
                  const end = new Date(req.end_date);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const lv = LEAVE_STATUS[req.status] ?? LEAVE_STATUS.pending;
                  return (
                    <div key={req.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy-800 capitalize">
                          {req.leave_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-navy-400 mt-0.5 font-mono">
                          {start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {" – "}
                          {end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {" · "}
                          {days}d
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${lv.pill} shrink-0`}>
                        {req.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-navy-400">No leave requests on record.</p>
            )}
            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-navy-100">
                <Link href="/org/leave" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Manage all leave →
                </Link>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Compensation */}
          <SectionCard title="Compensation" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest mb-1">Annual salary</p>
              <p className="font-mono text-2xl font-bold text-navy-900 tabular-nums">
                {employee.salary
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: employee.salary_currency ?? "USD",
                      maximumFractionDigits: 0,
                    }).format(employee.salary)
                  : "—"}
              </p>
            </div>
            <Field label="Currency" value={employee.salary_currency ?? "USD"} />
          </SectionCard>

          {/* Personal info */}
          <SectionCard title="Personal info" icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">
            <div className="space-y-4">
              <Field label="Phone"   value={employee.phone}   icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              <Field label="Country" value={employee.country} icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <Field label="Address" value={employee.address} icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </div>
          </SectionCard>

          {/* Emergency contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <SectionCard title="Emergency contact" icon="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z">
              <div className="space-y-4">
                <Field label="Name"  value={employee.emergency_contact_name} />
                <Field label="Phone" value={employee.emergency_contact_phone} />
              </div>
            </SectionCard>
          )}

          {/* Assigned assets */}
          <SectionCard title="Assigned assets" icon="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
            {assetAssignments.length > 0 ? (
              <div className="space-y-1">
                {assetAssignments.map((assignment) => {
                  const asset = assetMap[assignment.asset_id];
                  return (
                    <div key={assignment.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-navy-50/60 border border-navy-100">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-800 truncate">{asset?.name ?? "Asset"}</p>
                        <p className="text-xs text-navy-400 truncate">
                          {asset?.asset_tag ?? asset?.serial_number ?? "No tag"}
                          {" - assigned "}
                          {fmt(assignment.assigned_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-navy-400">No company equipment assigned.</p>
            )}
            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-navy-100">
                <Link href="/assets" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Manage assets -&gt;
                </Link>
              </div>
            )}
          </SectionCard>

          {/* Documents */}
          <SectionCard title="Documents" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
            {documents && documents.length > 0 ? (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-navy-50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-navy-700 truncate group-hover:text-blue-700 transition-colors font-medium">
                      {doc.file_name}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-navy-400">No documents uploaded.</p>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Notes */}
      {employee.notes && (
        <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-4 w-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="text-sm font-bold text-navy-800">Notes</h2>
          </div>
          <p className="text-sm text-navy-600 whitespace-pre-wrap leading-relaxed">{employee.notes}</p>
        </div>
      )}
    </div>
  );
}
