import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const missingBrowserSupabaseMsg =
  "Supabase env is incomplete. In .env or .env.local set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase → Project Settings → API — use the anon/public key, not the service_role key). Restart `npm run dev` after saving.";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.trim() || !supabaseKey?.trim()) {
    throw new Error(missingBrowserSupabaseMsg);
  }

  return createBrowserClient<Database>(url, supabaseKey);
}
