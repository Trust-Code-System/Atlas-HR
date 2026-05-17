import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageSummary } from "@/lib/usage";
import type { UserRole } from "@/lib/limits";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      tool_generations: { used: 0, limit: 5, allowed: true },
      copilot_messages: { used: 0, limit: 20, allowed: true },
      saved_items_count: 0,
      saved_items_limit: 50,
      role: "free",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "free") as UserRole;
  const summary = await getUsageSummary(user.id, role);

  return NextResponse.json({ ...summary, role });
}
