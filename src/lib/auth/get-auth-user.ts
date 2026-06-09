import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Request-scoped, deduplicated Supabase auth user.
 *
 * `supabase.auth.getUser()` validates the session JWT against the Supabase Auth
 * server on every call — a network round-trip. A single page render previously
 * triggered several of these (layout, profile, org, plan helpers each calling
 * it independently). Wrapping it in React.cache collapses them to ONE round-trip
 * per request: the hot auth/org helpers all route through this.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});
