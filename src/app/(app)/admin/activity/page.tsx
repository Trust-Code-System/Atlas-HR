import type { Metadata } from "next";
import { UserPlus, FileText, MessageSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin — Activity" };
export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type ActivityItem = {
  id: string;
  type: "signup" | "document" | "copilot" | "thread";
  label: string;
  sub: string;
  at: string;
};

export default async function AdminActivityPage() {
  const supabase = await createClient();

  const [
    { data: recentUsers },
    { data: recentDocs },
    { data: recentConvos },
    { data: recentThreads },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("generated_documents")
      .select("id, tool_name, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("copilot_conversations")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("community_threads")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const items: ActivityItem[] = [
    ...(recentUsers ?? []).map((u) => ({
      id: `signup-${u.id}`,
      type: "signup" as const,
      label: u.full_name ?? u.email ?? "New user",
      sub: "Signed up",
      at: u.created_at,
    })),
    ...(recentDocs ?? []).map((d) => ({
      id: `doc-${d.id}`,
      type: "document" as const,
      label: d.tool_name,
      sub: "Document generated",
      at: d.created_at,
    })),
    ...(recentConvos ?? []).map((c) => ({
      id: `convo-${c.id}`,
      type: "copilot" as const,
      label: c.title ?? "Untitled conversation",
      sub: "Copilot conversation started",
      at: c.created_at,
    })),
    ...(recentThreads ?? []).map((t) => ({
      id: `thread-${t.id}`,
      type: "thread" as const,
      label: t.title,
      sub: "Community thread posted",
      at: t.created_at,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 60);

  const ICON = {
    signup: UserPlus,
    document: FileText,
    copilot: MessageSquare,
    thread: Users,
  };

  const ICON_COLOR = {
    signup: "bg-[--success]/10 text-[--success]",
    document: "bg-[--accent-soft] text-[--accent]",
    copilot: "bg-chart-4/10 text-chart-4",
    thread: "bg-amber-500/10 text-amber-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[--text-primary]">Recent activity</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Latest signups, documents, copilot sessions, and community threads across the platform.
        </p>
      </div>

      <div className="rounded-xl border border-[--border] bg-[--bg-card]">
        {items.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-[--text-tertiary]">No activity yet.</p>
        )}
        <ul className="divide-y divide-[--border]">
          {items.map((item) => {
            const Icon = ICON[item.type];
            const color = ICON_COLOR[item.type];
            return (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[--text-primary]">{item.label}</p>
                  <p className="text-xs text-[--text-tertiary]">{item.sub}</p>
                </div>
                <time className="shrink-0 text-xs text-[--text-tertiary]">{timeAgo(item.at)}</time>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
