import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { streamChatText, aiProviderStatus } from "@/lib/ai/provider";
import { SKILL_SYSTEM_PROMPTS } from "@/lib/ai/skills-catalog";

export async function POST(req: NextRequest) {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { skillId: string; prompt: string };
  try {
    body = (await req.json()) as { skillId: string; prompt: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { skillId, prompt } = body;
  if (!skillId || !prompt) {
    return NextResponse.json({ error: "skillId and prompt are required" }, { status: 400 });
  }

  const systemPrompt = SKILL_SYSTEM_PROMPTS[skillId];
  if (!systemPrompt) {
    return NextResponse.json({ error: "Unknown skill" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: skill } = await supabase
    .from("org_enabled_skills")
    .select("id")
    .eq("org_id", orgCtx.org.id)
    .eq("skill_id", skillId)
    .single();

  if (!skill) {
    return NextResponse.json({ error: "Skill not enabled for this organisation" }, { status: 403 });
  }

  const status = aiProviderStatus();
  if (!status.anthropic && !status.openai) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const encoder = new TextEncoder();

  // Stream through the shared provider so skills get the Claude→OpenAI fallback.
  const aiStream = streamChatText({
    system: systemPrompt,
    anthropicMessages: [{ role: "user", content: prompt }],
    openaiMessages: [{ role: "user", content: prompt }],
    maxTokens: 2048,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of aiStream) {
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
