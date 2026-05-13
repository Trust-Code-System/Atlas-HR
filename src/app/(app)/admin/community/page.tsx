import { MessageSquare, Lock, Eye, Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type Thread = {
  id: string;
  title: string;
  category: string;
  is_locked: boolean;
  is_pinned: boolean;
  reply_count: number;
  vote_count: number;
  view_count: number;
  is_anonymous: boolean;
  author_id: string;
  created_at: string;
};

type Profile = { id: string; full_name: string | null; email: string };

type DbError = { message: string };
type QueryBuilder<T = Record<string, unknown>> = {
  select(columns?: string): QueryBuilder<T>;
  eq(col: string, val: unknown): QueryBuilder<T>;
  in(col: string, vals: unknown[]): QueryBuilder<T>;
  order(column: string, options?: Record<string, unknown>): QueryBuilder<T>;
  update(values: Partial<T>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  limit(n: number): QueryBuilder<T>;
  then<R1 = { data: T[] | null; error: DbError | null }, R2 = never>(
    f?: ((v: { data: T[] | null; error: DbError | null }) => R1 | PromiseLike<R1>) | null,
    g?: ((r: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2>;
};
type UntypedSupabase = { from<T = Record<string, unknown>>(table: string): QueryBuilder<T> };

async function lockThread(formData: FormData) {
  "use server";
  const id = formData.get("thread_id") as string;
  const locked = formData.get("locked") === "true";
  const supabase = createAdminClient() as unknown as UntypedSupabase;
  await supabase.from("community_threads").update({ is_locked: locked }).eq("id", id);
  revalidatePath("/admin/community");
}

async function deleteThread(formData: FormData) {
  "use server";
  const id = formData.get("thread_id") as string;
  const supabase = createAdminClient() as unknown as UntypedSupabase;
  await supabase.from("community_threads").delete().eq("id", id);
  revalidatePath("/admin/community");
}

export default async function AdminCommunityPage() {
  const supabase = createAdminClient() as unknown as UntypedSupabase;

  const { data: threads } = await supabase
    .from<Thread>("community_threads")
    .select("id, title, category, is_locked, is_pinned, reply_count, vote_count, view_count, is_anonymous, author_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = threads ?? [];

  const authorIds = [...new Set(rows.filter((t) => !t.is_anonymous).map((t) => t.author_id))];
  const profilesRes = authorIds.length
    ? await supabase.from<Profile>("profiles").select("id, full_name, email").in("id", authorIds)
    : { data: [] as Profile[] };

  const profileMap = Object.fromEntries(
    ((profilesRes as { data: Profile[] | null }).data ?? []).map((p) => [p.id, p])
  );

  const totalThreads = rows.length;
  const locked = rows.filter((t) => t.is_locked).length;
  const pinned = rows.filter((t) => t.is_pinned).length;
  const totalReplies = rows.reduce((s, t) => s + t.reply_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[--text-primary]">Community moderation</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">Lock, pin, or delete community threads.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={MessageSquare} label="Threads" value={totalThreads} />
        <Metric icon={MessageSquare} label="Total replies" value={totalReplies} />
        <Metric icon={Lock} label="Locked" value={locked} />
        <Metric icon={Eye} label="Pinned" value={pinned} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[--border]">
        <table className="w-full text-sm">
          <thead className="border-b border-[--border] bg-[--bg-card]">
            <tr>
              {["Thread", "Category", "Author", "Replies", "Votes", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[--text-secondary]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {rows.map((thread) => {
              const profile = !thread.is_anonymous ? profileMap[thread.author_id] : undefined;
              const authorName = thread.is_anonymous ? "Anonymous" : (profile?.full_name ?? profile?.email ?? "Unknown");
              const date = new Date(thread.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              return (
                <tr key={thread.id} className="hover:bg-[--bg-hover]">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate font-medium text-[--text-primary]" title={thread.title}>
                      {thread.title}
                    </p>
                    <p className="text-xs text-[--text-tertiary]">{date}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-[--text-secondary]">{thread.category}</td>
                  <td className="px-4 py-3 text-[--text-secondary]">{authorName}</td>
                  <td className="px-4 py-3 text-[--text-secondary]">{thread.reply_count}</td>
                  <td className="px-4 py-3 text-[--text-secondary]">{thread.vote_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {thread.is_locked && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                          locked
                        </span>
                      )}
                      {thread.is_pinned && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                          pinned
                        </span>
                      )}
                      {!thread.is_locked && !thread.is_pinned && (
                        <span className="text-xs text-[--text-tertiary]">open</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <form action={lockThread}>
                        <input type="hidden" name="thread_id" value={thread.id} />
                        <input type="hidden" name="locked" value={String(!thread.is_locked)} />
                        <button
                          type="submit"
                          className="rounded-md border border-[--border] px-2 py-1 text-xs hover:bg-[--bg-hover]"
                          title={thread.is_locked ? "Unlock thread" : "Lock thread"}
                        >
                          <Lock size={12} className="inline" /> {thread.is_locked ? "Unlock" : "Lock"}
                        </button>
                      </form>
                      <form action={deleteThread}>
                        <input type="hidden" name="thread_id" value={thread.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          title="Delete thread"
                          onClick={(e) => {
                            if (!confirm("Permanently delete this thread and all its replies?")) e.preventDefault();
                          }}
                        >
                          <Trash2 size={12} className="inline" /> Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[--text-tertiary]">
                  No threads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof MessageSquare; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--bg-card] p-4">
      <Icon size={18} className="text-[--accent]" />
      <p className="mt-3 text-2xl font-semibold text-[--text-primary]">{value}</p>
      <p className="text-sm text-[--text-secondary]">{label}</p>
    </div>
  );
}
