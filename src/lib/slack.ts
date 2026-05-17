import { createClient } from "@/lib/supabase/server";

export interface SlackNotification {
  title: string;
  body: string;
  color?: string;
  fields?: { title: string; value: string; short?: boolean }[];
}

export async function sendSlackNotification(orgId: string, notification: SlackNotification): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_integrations")
    .select("config")
    .eq("org_id", orgId)
    .eq("integration_id", "slack")
    .eq("is_active", true)
    .maybeSingle();

  const webhookUrl = (data?.config as Record<string, string> | null)?.webhook_url;
  if (!webhookUrl) return;

  const payload = {
    attachments: [
      {
        color: notification.color ?? "#2563eb",
        title: notification.title,
        text: notification.body,
        fields: notification.fields,
        footer: "Atlas HR",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
