import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organisation Settings | Atlas HR" };

const GRADS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
];

function memberGrad(name: string | undefined | null): string {
  if (!name) return GRADS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADS[Math.abs(h) % GRADS.length];
}

export default async function OrgSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgData = await getCurrentOrg();
  if (!orgData) redirect("/onboarding/org");

  const { org, isAdmin } = orgData;
  if (!isAdmin) redirect("/dashboard");

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("org_members")
    .select("*, profiles(full_name, email, avatar_url)")
    .eq("org_id", org.id);

  const { data: pendingInvites } = await supabase
    .from("org_invites")
    .select("*")
    .eq("org_id", org.id)
    .is("accepted_at", null);

  const adminCount = (members ?? []).filter((m) => m.org_role === "admin").length;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] bg-linear-to-br from-navy-950 via-navy-900 to-navy-800 px-7 py-6 mb-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Organisation Settings</h1>
            <p className="text-blue-300 text-sm mt-0.5">
              {org.name} · {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
              {adminCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-blue-400/30">
                  {adminCount} admin{adminCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Organisation details */}
      <section className="bg-white rounded-2xl border border-navy-200 p-6 mb-6 shadow-sm">
        <h2 className="font-bold text-navy-900 mb-5">Organisation details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-widest block mb-1">Name</label>
            <p className="text-sm font-semibold text-navy-800">{org.name}</p>
          </div>
          {org.slug && (
            <div>
              <label className="text-xs font-bold text-navy-500 uppercase tracking-widest block mb-1">Slug</label>
              <p className="text-sm text-navy-600 font-mono bg-navy-50 border border-navy-200 rounded-lg px-3 py-1.5 w-fit">{org.slug}</p>
            </div>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="bg-white rounded-2xl border border-navy-200 overflow-hidden mb-6 shadow-sm">
        <div className="px-5 py-4 border-b border-navy-200 bg-navy-50/80 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Members</h2>
          <span className="bg-navy-100 border border-navy-200 text-navy-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {members?.length ?? 0}
          </span>
        </div>
        <div className="divide-y divide-navy-100">
          {members?.map((m) => {
            const profile = m.profiles as { full_name?: string; email?: string; avatar_url?: string } | null;
            const grad = memberGrad(profile?.full_name ?? profile?.email);
            return (
              <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-navy-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <Avatar name={profile.full_name ?? profile.email} src={profile.avatar_url} size="sm" />
                  ) : (
                    <div className={`h-9 w-9 rounded-xl bg-linear-to-br ${grad} flex items-center justify-center shrink-0`}>
                      <span className="text-xs font-bold text-white">
                        {(profile?.full_name ?? profile?.email ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-navy-800">{profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-navy-400">{profile?.email}</p>
                  </div>
                </div>
                <Badge variant={m.org_role === "admin" ? "success" : "default"}>
                  {m.org_role}
                </Badge>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pending invites */}
      {(pendingInvites?.length ?? 0) > 0 && (
        <section className="bg-white rounded-2xl border border-navy-200 overflow-hidden mb-6 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-200 bg-navy-50/80 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Pending invitations</h2>
            <span className="bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingInvites?.length}
            </span>
          </div>
          <div className="divide-y divide-navy-100">
            {pendingInvites?.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-navy-50/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{inv.email}</p>
                  <p className="font-mono text-xs text-navy-400">
                    Expires {new Date(inv.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
        <h2 className="font-bold text-red-600 mb-2">Danger zone</h2>
        <p className="text-navy-500 text-sm mb-4">
          Deleting your organisation is permanent and cannot be undone. All data will be lost.
        </p>
        <button type="button" className="text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2 rounded-xl transition-colors">
          Delete organisation
        </button>
      </section>
    </div>
  );
}
