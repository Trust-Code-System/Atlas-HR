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
import { streamChatText, streamChatWithTools, type StreamChatOptions } from "@/lib/ai/provider";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getOrgAiContext } from "@/lib/ai/org-ai-context";
import { searchOrgKnowledge, buildGroundingFragment, type KbSource } from "@/lib/ai/kb/retrieve";
import { HR_TOOLS, makeHrToolRunner, type HrToolContext } from "@/lib/ai/tools/hr-tools";
import { WEB_TOOLS, WEB_TOOL_NAMES, makeWebToolRunner } from "@/lib/ai/tools/web-tools";
import { isWebSearchConfigured } from "@/lib/ai/web-search";
import {
  ATLAS_BASE_SYSTEM_PROMPT,
  ATLAS_EMPLOYEE_SYSTEM_PROMPT,
  buildModeContext,
} from "@/lib/ai/prompts/atlas-system-prompt";
import { classifyRequest } from "@/lib/ai/intent";
import { routeModel } from "@/lib/ai/model-router";
import { canViewSalaryData, canDo } from "@/lib/auth/permissions";

// The agentic tool loop can run several model rounds plus tool calls and
// "deep thinking", which easily exceeds Vercel's short default function
// budget — when the function is killed mid-stream the answer arrives empty.
// Give it room to finish (Vercel clamps to the plan's allowed maximum).
export const runtime = "nodejs";
export const maxDuration = 60;

// Atlas AI's identity and behaviour live in one place so every surface stays
// consistent — see src/lib/ai/prompts/atlas-system-prompt.ts.
const SYSTEM_PROMPT = ATLAS_BASE_SYSTEM_PROMPT;
const EMPLOYEE_SYSTEM_PROMPT = ATLAS_EMPLOYEE_SYSTEM_PROMPT;

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

  // Intent classification — detect the HR behaviour mode, risk, and approval
  // posture for this request. The mode guidance steers tone/behaviour; the
  // risk/approval signals are recorded for audit + analytics. Actual data
  // access is still enforced by RLS and the permission helpers, never by this.
  const intent = classifyRequest(userQuery);
  // Only steer admin-side surfaces by detected mode; employees stay in the
  // fixed self-service scope regardless of phrasing.
  if (!isEmployeePortal && intent.mode !== "general") {
    finalSystem += buildModeContext(intent.mode);
  }

  // Smart routing: pick the model, extended-thinking, and output-token budget
  // for THIS request based on its detected difficulty/risk. Everyday questions
  // stay fast and cheap; hard, high-risk, document-heavy, or long requests are
  // escalated to a stronger model and/or given thinking + a larger budget. This
  // also fixes the old fixed 2048-token cap that silently truncated documents.
  const route = routeModel({
    intent,
    userRequestedThinking: thinking === true,
    messageLength: userQuery.length,
    hasAttachments: Boolean(lastUserMessage?.attachments?.length),
    isEmployeePortal,
  });

  if (relevantArticles.length > 0) {
    const refs = relevantArticles
      .map((a) => `- "${a.title}" (${a.category.replace(/-/g, " ")}): ${a.excerpt}`)
      .join("\n");
    finalSystem += `\n\n--- Relevant Atlas Knowledge Hub Articles ---\nThe following articles from the Atlas knowledge base are relevant to this query. Reference them naturally in your response where appropriate:\n${refs}`;
  }

  // Ground answers in the organisation's own uploaded documents (RAG) and make
  // the assistant aware of which integrations/skills the workspace has enabled.
  // Document grounding applies to employees too, so they get answers from the
  // org's published policies (with citations + no-guess / contact-HR behaviour).
  let docSources: KbSource[] = [];
  // Org context used to give the assistant live HR data tools (read-only,
  // RLS-scoped). Captured here so the stream call below can attach the runner.
  let toolOrgId: string | null = null;
  let toolIsAdmin = false;
  // Column-level gates for the compensation/performance tools. RLS protects
  // rows; these protect sensitive columns the model must not aggregate without
  // permission. Computed once here and passed into the tool runner.
  let toolCanViewComp = false;
  let toolCanViewPerf = false;
  if (user) {
    try {
      const orgCtx = await getCurrentOrg();
      if (orgCtx) {
        toolOrgId = orgCtx.org.id;
        toolIsAdmin = orgCtx.isAdmin;
        const [compAllowed, perfManage, analyticsAllowed] = await Promise.all([
          canViewSalaryData(orgCtx.org.id),
          canDo(orgCtx.org.id, "canManagePerformance"),
          canDo(orgCtx.org.id, "canViewAnalytics"),
        ]);
        toolCanViewComp = compAllowed;
        toolCanViewPerf = orgCtx.isAdmin || perfManage || analyticsAllowed;
        const hits = await searchOrgKnowledge(supabase, orgCtx.org.id, userQuery, 6);
        const { systemFragment, sources } = buildGroundingFragment(hits);
        if (systemFragment) {
          finalSystem += systemFragment;
          docSources = sources;
        }
        if (!isEmployeePortal) {
          const { promptFragment } = await getOrgAiContext(supabase, orgCtx.org.id);
          finalSystem += promptFragment;
        }
      }
    } catch {
      // Non-fatal — the assistant still works without grounding/integration awareness.
    }
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
      detected_mode: intent.mode,
      risk_level: intent.riskLevel,
      needs_approval: intent.needsApproval,
      sensitive_data: intent.sensitiveDataInvolved,
      routed_model: route.model,
      routed_escalated: route.escalated,
      routed_reason: route.reason,
    });
  }

  const useThinking = route.thinking;
  const copilotStart = Date.now();

  // Tell the model it can ground answers in the live web when a provider is set.
  if (toolOrgId !== null && isWebSearchConfigured()) {
    finalSystem +=
      "\n\n--- Web grounding ---\nYou can call `web_search` for live external facts (current employment law, statutory rates, salary benchmarks, regulatory changes, HR news). Use it when the answer isn't in the workspace's own data or your knowledge may be out of date, prefer official sources for legal figures, and cite the source URLs you relied on.";
  }

  const baseStreamOpts = {
    system: finalSystem,
    anthropicMessages: toAnthropicMessages(messages) as StreamChatOptions["anthropicMessages"],
    openaiMessages: messages.map((m) => ({ role: m.role, content: m.content })),
    model: route.model,
    maxTokens: route.maxTokens,
    thinking: route.thinking,
    thinkingBudgetTokens: route.thinkingBudgetTokens,
  };

  // When the user belongs to an org, give the assistant live HR data tools.
  // Tools run on the request's RLS-scoped client, so results are automatically
  // limited to what this user may see (admins → whole org, managers → their
  // reports, employees → their own record). When a web-search provider is
  // configured, also give it live web grounding (cited external facts).
  let aiStream: AsyncGenerator<string>;
  if (toolOrgId !== null) {
    const hrRun = makeHrToolRunner({
      supabase,
      orgId: toolOrgId,
      isAdmin: toolIsAdmin,
      canViewCompensation: toolCanViewComp,
      canViewPerformance: toolCanViewPerf,
    } satisfies HrToolContext);
    const webEnabled = isWebSearchConfigured();
    const webRun = webEnabled ? makeWebToolRunner() : null;
    const tools = webEnabled ? [...HR_TOOLS, ...WEB_TOOLS] : HR_TOOLS;
    aiStream = streamChatWithTools({
      ...baseStreamOpts,
      tools,
      runTool: (name, input) =>
        webRun && WEB_TOOL_NAMES.has(name) ? webRun(name, input) : hrRun(name, input),
    });
  } else {
    aiStream = streamChatText(baseStreamOpts);
  }
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      // Emit knowledge sources found for this query — curated Atlas articles plus
      // the organisation's own indexed documents (RAG).
      const articleSources = relevantArticles.map((a) => ({
        kind: "article" as const,
        title: a.title,
        slug: a.slug,
        category: a.category,
      }));
      const documentSources = docSources.map((d) => ({
        kind: "document" as const,
        title: d.title,
        docId: d.docId,
      }));
      const allSources = [...articleSources, ...documentSources];
      if (allSources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: allSources })}\n\n`)
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
