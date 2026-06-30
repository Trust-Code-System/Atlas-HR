import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsTabs } from "../settings-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log | Atlas HR" };

const ACTION_COLORS: Record<string, { pill: string; dot: string }> = {
  delete: { pill: "bg-red-50 text-red-700 border border-red-200",     dot: "bg-red-400" },
  remove: { pill: "bg-red-50 text-red-700 border border-red-200",     dot: "bg-red-400" },
  create: { pill: "bg-blue-50 text-blue-700 border border-blue-200",  dot: "bg-blue-500" },
  add:    { pill: "bg-blue-50 text-blue-700 border border-blue-200",  dot: "bg-blue-500" },
  start:  { pill: "bg-blue-50 text-blue-700 border border-blue-200",  dot: "bg-blue-500" },
  update: { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  edit:   { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  change: { pill: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  default:{ pill: "bg-navy-100 text-navy-600 border border-navy-200",  dot: "bg-navy-400" },
};

function actionStyle(action: string) {
  for (const [key, style] of Object.entries(ACTION_COLORS)) {
    if (key !== "default" && action.includes(key)) return style;
  }
  return ACTION_COLORS.default;
}

function adminInitials(name: string | undefined, email: string | undefined) {
  const src = name ?? email ?? "?";
  return src[0].toUpperCase();
}

function deptGrad(char: string) {
  const GRADS = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-500",
  ];
  return GRADS[char.charCodeAt(0) % GRADS.length];
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/settings");

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1));
  const pageSize = 50;

  const supabase = await createClient();

  const { data: logs, count } = await supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  const allLogs = logs ?? [];
  const adminIds = [...new Set(allLogs.map((l) => l.admin_user_id))];

  const { data: profiles } = adminIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", adminIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              Audit log · {count ?? 0} total events
            </p>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <SettingsTabs />

      {/* Log entries */}
      <div className="bg-white rounded-2xl border border-navy-200 overflow-hidden shadow-sm">
        {allLogs.length > 0 ? (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-navy-50/80 border-b border-navy-200 text-[11px] font-bold text-navy-400 uppercase tracking-widest">
              <div className="col-span-7">Action</div>
              <div className="col-span-3 hidden sm:block">Resource</div>
              <div className="col-span-5 sm:col-span-2 text-right">Time</div>
            </div>
            <div className="divide-y divide-navy-100">
              {allLogs.map((log) => {
                const admin = profileMap[log.admin_user_id];
                const style = actionStyle(log.action);
                const grad = deptGrad(adminInitials(admin?.full_name ?? undefined, admin?.email ?? undefined));
                return (
                  <div key={log.id} className="px-5 py-4 hover:bg-navy-50/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center shrink-0 mt-0.5`}>
                          <span className="text-xs font-bold text-white">
                            {adminInitials(admin?.full_name ?? undefined, admin?.email ?? undefined)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-navy-800">
                              {admin?.full_name ?? admin?.email ?? "Unknown admin"}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${style.pill}`}>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                          {log.target_resource && (
                            <p className="text-xs text-navy-500 mt-0.5 font-mono">
                              {log.target_resource}
                              {log.target_resource_id && ` · ${log.target_resource_id.slice(0, 8)}…`}
                            </p>
                          )}
                          {log.reason && (
                            <p className="text-xs text-navy-400 mt-0.5 italic">&quot;{log.reason}&quot;</p>
                          )}
                        </div>
                      </div>
                      <time className="font-mono text-xs text-navy-400 shrink-0 mt-1">
                        {new Date(log.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-navy-200 bg-navy-50">
                <p className="text-sm text-navy-400">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Link href={`?page=${currentPage - 1}`} className="px-3 py-1.5 text-sm border border-navy-200 rounded-xl hover:bg-white text-navy-600 transition-colors font-medium">
                      ← Previous
                    </Link>
                  )}
                  {currentPage < totalPages && (
                    <Link href={`?page=${currentPage + 1}`} className="px-3 py-1.5 text-sm border border-navy-200 rounded-xl hover:bg-white text-navy-600 transition-colors font-medium">
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-navy-100 to-navy-200 flex items-center justify-center mb-4 shadow-sm">
              <svg className="h-8 w-8 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">No audit events yet</h3>
            <p className="text-sm text-navy-500">Admin actions will appear here as they happen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
