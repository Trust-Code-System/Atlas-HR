import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import { SettingsTabs } from "../settings-tabs";
import { TeamClient } from "./team-client";
import { InviteForm } from "./invite-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Members | Atlas HR" };

export default async function TeamSettingsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");
  if (!orgCtx.isAdmin) redirect("/settings");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", orgCtx.org.id)
    .order("joined_at", { ascending: true });

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">
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
            <p className="text-blue-300 text-sm mt-0.5">Team members · {members?.length ?? 0} in {orgCtx.org.name}</p>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <SettingsTabs />

      <InviteForm />

      <TeamClient
        members={members ?? []}
        profileMap={profileMap as Record<string, { id: string; full_name: string | null; email: string; avatar_url: string | null }>}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
