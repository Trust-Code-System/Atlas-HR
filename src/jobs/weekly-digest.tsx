import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { WeeklyDigest } from "@/emails/digest/WeeklyDigest";
import { TOOLS_CONFIG } from "@/lib/tools-config";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  notification_preferences: unknown;
};

type ThreadRow = {
  id: string;
  title: string;
};

function firstName(profile: ProfileRow) {
  return (profile.full_name ?? profile.email).split(/\s+/)[0] || "there";
}

function prefsAllowDigest(prefs: unknown) {
  if (!prefs || typeof prefs !== "object") return true;
  const emailPrefs = (prefs as { email?: Record<string, unknown> }).email;
  return emailPrefs?.weekly_digest !== false;
}

function weekRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 7);
  return `${start.toLocaleDateString("en", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWeeklyDigest() {
  const supabase = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [{ data: profiles }, { data: threads }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, notification_preferences")
      .not("email", "is", null),
    supabase
      .from("community_threads")
      .select("id, title")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("vote_count", { ascending: false })
      .limit(3),
  ]);

  const digestThreads = ((threads ?? []) as ThreadRow[]).map((thread) => ({
    title: thread.title,
    href: `${baseUrl}/community/thread/${thread.id}`,
  }));
  const articles = [
    { title: "The HR policy essentials every growing team needs", href: `${baseUrl}/knowledge` },
    { title: "Performance conversations that create clarity", href: `${baseUrl}/knowledge` },
    { title: "Practical onboarding checks before day one", href: `${baseUrl}/knowledge` },
  ];
  const tools = TOOLS_CONFIG.slice(0, 2).map((tool) => ({
    title: tool.name,
    href: `${baseUrl}/tools/${tool.slug}`,
  }));

  let sent = 0;
  let skipped = 0;

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    if (!profile.email || !prefsAllowDigest(profile.notification_preferences)) {
      skipped += 1;
      continue;
    }

    await sendEmail({
      to: profile.email,
      userId: profile.id,
      type: "weekly_digest",
      subject: `Your Atlas HR week - ${weekRange()}`,
      react: (
        <WeeklyDigest
          firstName={firstName(profile)}
          weekRange={weekRange()}
          articles={articles}
          threads={digestThreads.length > 0 ? digestThreads : [{ title: "Browse the latest community discussions", href: `${baseUrl}/community` }]}
          tools={tools}
          usageSummary="Your week: open Atlas HR to see your latest documents, Copilot conversations, and saved resources."
          dashboardUrl={`${baseUrl}/dashboard`}
          unsubscribeUrl={unsubscribeUrl(profile.id, "weekly_digest")}
        />
      ),
      unsubscribeUrl: unsubscribeUrl(profile.id, "weekly_digest"),
      isMarketing: true,
    });
    sent += 1;
    await delay(600);
  }

  return { sent, skipped };
}
