import { PostHog } from "posthog-node";

function makeClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  defaultValue = false
): Promise<boolean> {
  if (!userId) return defaultValue;
  const client = makeClient();
  if (!client) return defaultValue;
  try {
    const result = await client.isFeatureEnabled(flagKey, userId);
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  } finally {
    await client.shutdown();
  }
}

// Initial flags — create these in the PostHog dashboard:
// - new_dashboard_layout
// - copilot_v2
// - community_realtime (kill switch)
// - beta_features
