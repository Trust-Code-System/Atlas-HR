import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { consumeUsage } from "@/lib/usage";
import { getUserWithPlan } from "@/lib/auth/get-user-with-plan";
import { trackEvent } from "@/lib/analytics/track-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAllKnowledgeArticles } from "@/lib/knowledge";
import type { KnowledgeArticle } from "@/lib/knowledge-shared";
import { streamChatText, type StreamChatOptions } from "@/lib/ai/provider";

const SYSTEM_PROMPT = `You are Atlas, the AI assistant built into Atlas HR. You help HR professionals with every people-related challenge — recruitment, compliance, performance management, employee relations, payroll, onboarding, offboarding, and more.

You give specific, actionable advice grounded in best practice and real-world experience. When the user mentions a country, you account for local labour law context but always recommend they verify with local legal counsel for high-stakes decisions.

You write clearly, warmly, and without unnecessary jargon. You treat HR professionals as experts in their field.

You can:
- Draft complete HR documents (job descriptions, offer letters, contracts, policies, PIPs, warning letters, termination letters, onboarding plans)
- Answer employment law and compliance questions (with appropriate caveats)
- Research salary benchmarking, HR trends, and best practice
- Analyse documents pasted by the user and provide structured feedback
- Review and improve HR processes, policies, and workflows
- Help with difficult people situations and employee relations
- Generate report summaries, checklists, and action plans

When drafting documents, produce the full, complete document — not an outline. Format with clear section headers, professional language, and add a brief review disclaimer where appropriate.

When your response involves specific legal obligations, statutory minimums, regulatory requirements, or situations where an employer error could carry legal or financial consequences, end your response with a line in this exact format — no extra text before or after it:
⚠️ LEGAL REVIEW: [One sentence naming the specific legal area and why expert verification is needed]`;

const EMPLOYEE_SYSTEM_PROMPT = `You are Atlas, an AI assistant helping employees use Atlas HR.

You help employees understand company policies, complete HR forms, calculate leave planning, and answer general HR questions. You only use the employee context provided and general Atlas HR knowledge.

You do not have access to other employees' data, HR admin operations, or compensation details beyond the employee's own visible record. If a question is outside that scope, suggest they contact their HR team.`;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20000),
        attachments: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().max(180),
              mediaType: z.string().max(120),
              size: z.number().max(12 * 1024 * 1024),
              kind: z.enum(["image", "pdf", "text"]),
              data: z.string().max(18_000_000).optional(),
              text: z.string().max(120000).optional(),
            })
          )
          .max(5)
          .optional(),
      })
    )
    .min(1)
    .max(100),
  conversationId: z.string().uuid().nullable().optional(),
  context: z.string().max(3000).optional(),
  thinking: z.boolean().optional(),
});

function scoreArticle(article: KnowledgeArticle, queryWords: string[]): number {
  const title = article.title.toLowerCase();
  const excerpt = article.excerpt.toLowerCase();
  const tags = article.tags.join(" ").toLowerCase();
  let score = 0;
  for (const w of queryWords) {
    if (title.includes(w)) score += 3;
    if (excerpt.includes(w)) score += 1;
    if (tags.includes(w)) score += 2;
  }
  return score;
}

function searchKnowledge(query: string, limit = 4): KnowledgeArticle[] {
  const queryWords = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (queryWords.length === 0) return [];
  try {
    const articles = getAllKnowledgeArticles();
    return articles
      .map((a) => ({ a, score: scoreArticle(a, queryWords) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ a }) => a);
  } catch {
    return [];
  }
}

function autoTitle(firstUserMessage: string): string {
  const words = firstUserMessage.trim().split(/\s+/);
  const truncated = words.slice(0, 8).join(" ");
  return truncated.length < firstUserMessage.trim().length ? `${truncated}…` : truncated;
}

function messageTextForStorage(message: z.infer<typeof bodySchema>["messages"][number]): string {
  if (!message.attachments?.length) return message.content;
  const files = message.attachments.map((file) => file.name).join(", ");
  return `${message.content}\n\nAttached files: ${files}`.trim();
}

function toAnthropicMessages(messages: z.infer<typeof bodySchema>["messages"]) {
  return messages.map((message) => {
    if (!message.attachments?.length) {
      return { role: message.role, content: message.content };
    }

    const contentBlocks: unknown[] = [];

    for (const file of message.attachments) {
      if (file.kind === "image" && file.data) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.mediaType,
            data: file.data,
          },
        });
      } else if (file.kind === "pdf" && file.data) {
        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: file.data,
          },
        });
      } else if (file.kind === "text" && file.text) {
        contentBlocks.push({
          type: "text",
          text: `<document name="${file.name}">\n${file.text}\n</document>`,
        });
      }
    }

    contentBlocks.push({ type: "text", text: message.content });
    return { role: message.role, content: contentBlocks };
  });
}

async function handlePost(req: NextRequest) {
  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }
  const { messages, conversationId: incomingConvId, context, thinking } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isEmployeePortal = false;
  if (user) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("roles")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const memberRoles: string[] = Array.isArray(membership?.roles) ? membership.roles : [];
    const ADMIN_ROLES = ["workspace_owner", "hr_admin", "people_manager"] as const;
    isEmployeePortal =
      memberRoles.includes("employee") &&
      !ADMIN_ROLES.some((r) => memberRoles.includes(r));
  }

  const basePrompt = isEmployeePortal ? EMPLOYEE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const systemWithContext = context
    ? `${basePrompt}\n\n--- Mode context ---\n${context}`
    : basePrompt;

  const lastUserMessage = messages[messages.length - 1];

  // Knowledge retrieval — search Atlas articles for relevant context
  const userQuery = lastUserMessage?.content ?? "";
  const relevantArticles = isEmployeePortal ? [] : searchKnowledge(userQuery, 4);
  let finalSystem = systemWithContext;
  if (relevantArticles.length > 0) {
    const refs = relevantArticles
      .map((a) => `- "${a.title}" (${a.category.replace(/-/g, " ")}): ${a.excerpt}`)
      .join("\n");
    finalSystem += `\n\n--- Relevant Atlas Knowledge Hub Articles ---\nThe following articles from the Atlas knowledge base are relevant to this query. Reference them naturally in your response where appropriate:\n${refs}`;
  }

  if (user) {
    const { role } = await getUserWithPlan();
    const usage = await consumeUsage(user.id, role, "copilot_messages_per_day", "day");
    if (!usage.allowed) {
      return new Response(
        JSON.stringify({
          error: "limit_reached",
          reason: `You've used all ${usage.limit} Copilot messages for today. Upgrade to Pro for unlimited access.`,
          upgrade_url: "/pricing",
        }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "86400" } }
      );
    }
  } else {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rl = await checkRateLimit(`copilot:${ip}`, 10, 86400);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "limit_reached", reason: "Sign up for free to continue chatting with Atlas.", upgrade_url: "/sign-up" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "86400" } }
      );
    }
  }

  const isFirstExchange = messages.length === 1;
  let conversationId = incomingConvId ?? null;

  if (user && lastUserMessage?.role === "user") {
    if (!conversationId) {
      const title = autoTitle(messageTextForStorage(lastUserMessage));
      const { data: conv } = await supabase
        .from("copilot_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      conversationId = conv?.id ?? null;
    } else {
      await supabase
        .from("copilot_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("user_id", user.id);
    }
    if (conversationId) {
      await supabase.from("copilot_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: messageTextForStorage(lastUserMessage),
      });
    }
  }

  if (user && lastUserMessage) {
    void trackEvent(user.id, "copilot_message_sent", {
      message_chars: lastUserMessage.content.length,
      conversation_id: conversationId,
      thinking_enabled: thinking ?? false,
    });
  }

  const useThinking = thinking === true;
  const copilotStart = Date.now();

  const aiStream = streamChatText({
    system: finalSystem,
    anthropicMessages: toAnthropicMessages(messages) as StreamChatOptions["anthropicMessages"],
    openaiMessages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxTokens: useThinking ? 16000 : 2048,
    thinking: useThinking,
  });
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      // Emit knowledge sources found for this query
      if (relevantArticles.length > 0) {
        const sources = relevantArticles.map((a) => ({
          title: a.title,
          slug: a.slug,
          category: a.category,
        }));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
        );
      }

      // Signal thinking mode started
      if (useThinking) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "thinking_start" })}\n\n`)
        );
      }

      for await (const text of aiStream) {
        fullText += text;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`)
        );
      }

      if (user) {
        void trackEvent(user.id, "copilot_message_received", {
          conversation_id: conversationId,
          response_chars: fullText.length,
          total_time_ms: Date.now() - copilotStart,
          thinking_enabled: useThinking,
        });
      }

      if (user && conversationId && fullText) {
        await supabase.from("copilot_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: fullText,
        });

        if (isFirstExchange) {
          const title = autoTitle(lastUserMessage ? messageTextForStorage(lastUserMessage) : "New conversation");
          await supabase
            .from("copilot_conversations")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", conversationId })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(readableStream, {
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
    Sentry.captureException(error, { tags: { route: "api_copilot" } });
    return new Response(JSON.stringify({ error: "Copilot failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
