import { PostHog } from "posthog-node";
import { createAdminClient } from "@/lib/supabase/admin";

function makeClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

async function userHasAnalyticsConsent(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("cookie_consent")
      .eq("id", userId)
      .single();

    if (!data?.cookie_consent) return false;
    const consent = data.cookie_consent as { analytics?: boolean };
    return consent.analytics === true;
  } catch {
    // Default to not tracking when consent cannot be determined
    return false;
  }
}

/** User behavior tracking — respects analytics consent. */
export async function trackServer(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const allowed = await userHasAnalyticsConsent(userId);
  if (!allowed) return;

  const client = makeClient();
  if (!client) return;
  client.capture({ distinctId: userId, event, properties });
  await client.shutdown();
}

/**
 * Revenue and system event tracking — bypasses user consent.
 * Use only for events that are necessary for contract performance or
 * legitimate business interest (GDPR Art. 6(1)(b/f)):
 * subscription lifecycle, payments, system health.
 * Events are not attributed to user behavior; no PII in properties.
 */
export async function trackInternal(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = makeClient();
  if (!client) return;
  client.capture({ distinctId: userId, event, properties: { ...properties, _internal: true } });
  await client.shutdown();
}
