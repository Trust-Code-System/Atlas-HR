import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Load one conversation's messages (owned by the signed-in user).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conversation } = await supabase
    .from("copilot_conversations")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("copilot_messages")
    .select("role, content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    conversation,
    messages: (messages ?? []).filter((m) => m.role === "user" || m.role === "assistant"),
  });
}
