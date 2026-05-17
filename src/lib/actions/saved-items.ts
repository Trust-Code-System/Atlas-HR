"use server";

import { createClient } from "@/lib/supabase/server";
import { getLimits } from "@/lib/limits";
import type { Database } from "@/types/database";
import type { UserRole } from "@/lib/limits";

type ItemType = Database["public"]["Tables"]["saved_items"]["Row"]["item_type"];

interface SavedItemArgs {
  item_type: ItemType;
  item_slug: string;
}

export async function toggleSavedItem({
  item_type,
  item_slug,
}: SavedItemArgs): Promise<{ saved: boolean; error?: string; limit_reached?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { saved: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", item_type)
    .eq("item_slug", item_slug)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_items").delete().eq("id", existing.id);
    return { saved: false };
  }

  // Check limit before inserting
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "free") as UserRole;
  const limits = getLimits(role);

  if (isFinite(limits.saved_items)) {
    const { count } = await supabase
      .from("saved_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= limits.saved_items) {
      return {
        saved: false,
        error: `Free plan limit reached — upgrade to save unlimited items.`,
        limit_reached: true,
      };
    }
  }

  await supabase
    .from("saved_items")
    .insert({ user_id: user.id, item_type, item_slug });
  return { saved: true };
}

export async function isSavedItem({
  item_type,
  item_slug,
}: SavedItemArgs): Promise<{ saved: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { saved: false };

  const { data } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", item_type)
    .eq("item_slug", item_slug)
    .maybeSingle();

  return { saved: Boolean(data) };
}
