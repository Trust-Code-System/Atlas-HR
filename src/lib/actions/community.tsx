"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { ReplyNotification } from "@/emails/community/ReplyNotification";

export async function createThread(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "General HR");
  const is_anonymous = formData.get("is_anonymous") === "on";

  if (!title || !body) return;

  const { data, error } = await supabase
    .from("community_threads")
    .insert({ author_id: user.id, title, body, category, is_anonymous })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/community");
  redirect(`/community/thread/${data.id}`);
}

export async function createReply(
  threadId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const body = String(formData.get("body") ?? "").trim();
  const is_anonymous = formData.get("is_anonymous") === "on";

  if (!body) return { error: "empty_body" };

  const { data: reply, error } = await supabase
    .from("community_replies")
    .insert({
      thread_id: threadId,
      author_id: user.id,
      body,
      is_anonymous,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Update reply_count + last_reply_at
  const { count } = await supabase
    .from("community_replies")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId);

  await supabase
    .from("community_threads")
    .update({
      reply_count: count ?? 0,
      last_reply_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  if (reply) {
    sendReplyNotification(threadId, reply.id, user.id, body, is_anonymous).catch((err) => {
      console.error("Failed to send reply notification", err);
    });
  }

  revalidatePath(`/community/thread/${threadId}`);
  return {};
}

async function sendReplyNotification(
  threadId: string,
  replyId: string,
  replierId: string,
  replyBody: string,
  isAnonymous: boolean
) {
  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("community_threads")
    .select("id, title, author_id")
    .eq("id", threadId)
    .single();

  if (!thread || thread.author_id === replierId) return;

  const [{ data: threadAuthor }, { data: replier }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, full_name, notification_preferences")
      .eq("id", thread.author_id)
      .single(),
    admin.from("profiles").select("full_name").eq("id", replierId).single(),
  ]);

  if (!threadAuthor?.email) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const replyUrl = `${baseUrl}/community/thread/${threadId}#reply-${replyId}`;
  await admin.from("notifications").insert({
    user_id: thread.author_id,
    type: "reply",
    title: `${isAnonymous ? "Anonymous HR professional" : replier?.full_name ?? "Someone"} replied to your thread`,
    body: replyBody.slice(0, 180),
    link: replyUrl,
  });

  const replyUnsub = unsubscribeUrl(thread.author_id, "reply_notification");
  await sendEmail({
    to: threadAuthor.email,
    userId: thread.author_id,
    type: "reply_notification",
    subject: `${isAnonymous ? "Someone" : replier?.full_name ?? "Someone"} replied to your thread`,
    react: (
      <ReplyNotification
        replierName={isAnonymous ? "Anonymous HR professional" : replier?.full_name ?? "Someone"}
        threadTitle={thread.title}
        replyPreview={replyBody}
        replyUrl={replyUrl}
        preferencesUrl={`${baseUrl}/settings?tab=Notifications`}
        unsubscribeUrl={replyUnsub}
      />
    ),
    unsubscribeUrl: replyUnsub,
  });
}

export async function voteOnTarget(
  target_type: "thread" | "reply",
  target_id: string
): Promise<{ vote_count: number; user_voted: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { vote_count: 0, user_voted: false, error: "not_authenticated" };

  // Check existing vote
  const { data: existing } = await supabase
    .from("community_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", target_type)
    .eq("target_id", target_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_votes").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("community_votes")
      .insert({ user_id: user.id, target_type, target_id, value: 1 });
  }

  // Recount for accuracy
  const { count } = await supabase
    .from("community_votes")
    .select("id", { count: "exact", head: true })
    .eq("target_type", target_type)
    .eq("target_id", target_id)
    .eq("value", 1);

  const vote_count = count ?? 0;

  if (target_type === "thread") {
    await supabase
      .from("community_threads")
      .update({ vote_count })
      .eq("id", target_id);
    revalidatePath("/community");
  } else {
    await supabase
      .from("community_replies")
      .update({ vote_count })
      .eq("id", target_id);
  }

  return { vote_count, user_voted: !existing };
}

export async function acceptAnswer(
  replyId: string,
  threadId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  // Verify user owns the thread
  const { data: thread } = await supabase
    .from("community_threads")
    .select("author_id")
    .eq("id", threadId)
    .single();

  if (thread?.author_id !== user.id) return { error: "not_thread_author" };

  // Clear existing accepted answers for this thread
  await supabase
    .from("community_replies")
    .update({ is_accepted_answer: false })
    .eq("thread_id", threadId);

  // Mark the selected reply as accepted
  await supabase
    .from("community_replies")
    .update({ is_accepted_answer: true })
    .eq("id", replyId);

  revalidatePath(`/community/thread/${threadId}`);
  return {};
}
