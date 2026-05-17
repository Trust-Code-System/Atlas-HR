import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client — server only. Never import in client components or (public) routes.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or empty. Add it from Supabase → Project Settings → API (use the service_role secret, not the anon key). It must live in .env / .env.local only — never NEXT_PUBLIC_. Restart the dev server after saving."
    );
  }

  return createClient<Database>(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
