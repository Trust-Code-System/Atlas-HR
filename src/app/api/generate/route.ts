import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getToolConfig } from "@/lib/tools-config";
import { createClient } from "@/lib/supabase/server";
import { consumeUsage } from "@/lib/usage";
import { getUserWithPlan } from "@/lib/auth/get-user-with-plan";
import { trackEvent } from "@/lib/analytics/track-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChatText } from "@/lib/ai/provider";

const bodySchema = z.object({
  toolSlug: z.string().min(1).max(100),
  inputs: z.record(z.string(), z.string().max(5000)),
});

function autoTitle(toolName: string, inputs: Record<string, string>): string {
  const hints = [inputs.jobTitle, inputs.employeeName, inputs.roleName, inputs.name]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return hints ? `${toolName}: ${hints}` : `${toolName} — ${new Date().toLocaleDateString()}`;
}

function limitResponse(reason: string) {
  return new Response(
    JSON.stringify({ error: "limit_reached", reason, upgrade_url: "/pricing" }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "86400" },
    }
  );
}

async function handlePost(req: NextRequest) {
  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }
  const { toolSlug, inputs } = parsed.data;

  const tool = getToolConfig(toolSlug);
  if (!tool) {
    return new Response(JSON.stringify({ error: "Tool not found" }), { status: 404 });
  }

  if (tool.toolType === "calculator" || !tool.promptTemplate) {
    return new Response(JSON.stringify({ error: "Calculators do not use AI generation" }), { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { role } = await getUserWithPlan();

    const usage = await consumeUsage(user.id, role, "tool_generations_per_month", "month");
    if (!usage.allowed) {
      return limitResponse("You have reached your monthly generation limit.");
    }
  } else {
    // Unauthenticated: distributed IP rate limit — 1 generation per day
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = await checkRateLimit(`gen:${ip}`, 1, 86400);
    if (!rl.allowed) {
      return limitResponse("Sign up to generate more documents.");
    }
  }

  const inputsFilledCount = Object.values(inputs as Record<string, string>).filter(Boolean).length;
  if (user) {
    void trackEvent(user.id, "tool_generation_started", {
      tool_slug: toolSlug,
      inputs_filled_count: inputsFilledCount,
    });
  }

  const generationStart = Date.now();
  const prompt = tool.promptTemplate(inputs);
  const system =
    "You are Atlas, an expert HR assistant. Provide professional, actionable, and legally-aware HR content. Always format output as clean markdown.";
  const aiStream = streamChatText({
    system,
    anthropicMessages: [{ role: "user", content: prompt }],
    openaiMessages: [{ role: "user", content: prompt }],
    maxTokens: 2048,
  });

  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      let fullText = "";

      for await (const text of aiStream) {
        fullText += text;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`)
        );
      }

      // Persist the document for authenticated users (usage already consumed atomically above)
      let documentId: string | null = null;
      if (user && fullText) {
        const savedDoc = await supabase
          .from("generated_documents")
          .insert({
            user_id: user.id,
            tool_slug: toolSlug,
            tool_name: tool.name,
            inputs,
            output: fullText,
            title: autoTitle(tool.name, inputs),
          })
          .select("id")
          .single();

        documentId = savedDoc?.data?.id ?? null;

        void trackEvent(user.id, "tool_generation_completed", {
          tool_slug: toolSlug,
          time_seconds: (Date.now() - generationStart) / 1000,
          output_chars: fullText.length,
        });
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", documentId })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    return await handlePost(req);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "api_generate" },
    });
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
