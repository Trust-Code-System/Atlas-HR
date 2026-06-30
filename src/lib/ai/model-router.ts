/**
 * Atlas AI — smart model / reasoning / output-budget routing.
 *
 * Everyday questions stay on the fast, cheap default model with a normal token
 * budget. Hard, high-risk, document-heavy, or long requests are automatically
 * escalated to a stronger model and/or given extended thinking and a larger
 * output budget — so quality scales with difficulty without paying premium
 * cost on every trivial query.
 *
 * The decision is derived from the deterministic intent classification
 * (`@/lib/ai/intent`) plus a few cheap signals (message length, attachments,
 * whether the user explicitly asked to "think"). It never changes what data the
 * user may access — that is always enforced by RLS and the permission helpers.
 *
 * Models are configurable via env so ops can tune cost/quality without a deploy:
 *   - ANTHROPIC_MODEL          fast default   (shared with provider.ts)
 *   - ANTHROPIC_MODEL_STRONG   escalation model for hard/high-stakes requests
 */
import type { IntentClassification } from "@/lib/ai/intent";

/** Fast, economical default — handles the bulk of everyday HR questions. */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
/** Strongest model — reserved for complex reasoning and high-stakes output. */
export const STRONG_MODEL = process.env.ANTHROPIC_MODEL_STRONG || "claude-opus-4-8";

export interface ModelRouteInputs {
  intent: IntentClassification;
  /** The user explicitly toggled "deep thinking" in the UI. */
  userRequestedThinking: boolean;
  /** Characters in the latest user message (a proxy for complexity). */
  messageLength: number;
  /** The request carries files (PDFs/images/long text) to reason over. */
  hasAttachments: boolean;
  /** Employee self-service surface — kept fast, cheap, and tightly scoped. */
  isEmployeePortal: boolean;
}

export interface ModelDecision {
  /** Anthropic model id to use for this request. */
  model: string;
  /** Whether to enable Anthropic extended thinking. */
  thinking: boolean;
  /** Output token budget (must exceed the thinking budget when thinking is on). */
  maxTokens: number;
  /** Thinking budget tokens (0 when thinking is off). */
  thinkingBudgetTokens: number;
  /** Whether this request was escalated above the default model. */
  escalated: boolean;
  /** Human-readable tags explaining the decision — recorded for audit/analytics. */
  reason: string;
}

const LONG_MESSAGE_CHARS = 700;
const LONG_WITH_ATTACHMENT_CHARS = 150;

/**
 * Decide the model, reasoning, and output budget for a single request.
 * Pure and dependency-free so it is trivially testable.
 */
export function routeModel(input: ModelRouteInputs): ModelDecision {
  const { intent, userRequestedThinking, messageLength, hasAttachments, isEmployeePortal } = input;

  // Employee self-service: fast, cheap, scoped. Never auto-escalated — these are
  // short personal questions and cost/latency matter most here.
  if (isEmployeePortal) {
    return {
      model: DEFAULT_MODEL,
      thinking: false,
      maxTokens: 3072,
      thinkingBudgetTokens: 0,
      escalated: false,
      reason: "employee_self_service",
    };
  }

  const tags: string[] = [];

  // Reasoning-heavy: genuine judgement/risk where step-by-step reasoning pays off.
  const reasoningHeavy =
    userRequestedThinking ||
    intent.riskLevel === "high" ||
    intent.riskLevel === "restricted" ||
    intent.mode === "compliance";
  if (userRequestedThinking) tags.push("user_requested_thinking");
  if (intent.riskLevel === "high" || intent.riskLevel === "restricted") tags.push(`risk_${intent.riskLevel}`);
  if (intent.mode === "compliance") tags.push("compliance");

  // Drafting-heavy: produces a full document/letter/policy/report — wants a
  // larger output budget and a stronger writer, but not necessarily thinking.
  // (Analytics/data lookups are deliberately excluded — they're answered from
  // tool data and stay on the fast model unless long or high-risk.)
  const draftingHeavy =
    intent.actionLevel >= 2 ||
    intent.mode === "policy" ||
    intent.mode === "document_editor" ||
    intent.mode === "hr_admin";
  if (draftingHeavy) tags.push("drafting_heavy");

  // Long / document-grounded requests benefit from a stronger model.
  const long =
    messageLength > LONG_MESSAGE_CHARS ||
    (hasAttachments && messageLength > LONG_WITH_ATTACHMENT_CHARS);
  if (long) tags.push("long_request");
  if (hasAttachments) tags.push("has_attachments");

  const thinking = reasoningHeavy;
  const escalateModel = reasoningHeavy || draftingHeavy || long || hasAttachments;

  let maxTokens: number;
  if (thinking) {
    // Output budget must comfortably exceed the thinking budget.
    maxTokens = 16000;
  } else if (draftingHeavy || long) {
    // Full documents/policies need room — the old 2048 cap silently truncated them.
    maxTokens = 8192;
  } else {
    maxTokens = 4096;
  }

  return {
    model: escalateModel ? STRONG_MODEL : DEFAULT_MODEL,
    thinking,
    maxTokens,
    thinkingBudgetTokens: thinking ? 10000 : 0,
    escalated: escalateModel,
    reason: tags.length ? tags.join(",") : "default",
  };
}
