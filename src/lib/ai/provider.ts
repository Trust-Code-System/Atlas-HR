import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Atlas AI provider layer.
 *
 * Keys are read from the environment — set either or both:
 *   - ANTHROPIC_API_KEY  (Claude, preferred)
 *   - OPENAI_API_KEY     (OpenAI, automatic fallback)
 *
 * Whichever keys are present are used immediately on the next deploy/restart.
 * Claude is used by default; if it is not configured or fails before producing
 * any output, the request automatically falls back to OpenAI.
 */

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export type ProviderStatus = { anthropic: boolean; openai: boolean };

export function aiProviderStatus(): ProviderStatus {
  return {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };
}

let anthropic: Anthropic | null = null;
function anthropicClient() {
  anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

let openai: OpenAI | null = null;
function openaiClient() {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export type OpenAIChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface StreamChatOptions {
  system: string;
  /** Rich Anthropic-format messages (supports images, PDFs, documents). */
  anthropicMessages: Anthropic.Messages.MessageParam[];
  /** Plain text messages used for the OpenAI fallback. */
  openaiMessages: OpenAIChatMessage[];
  maxTokens: number;
  /** Anthropic extended thinking (ignored by the OpenAI fallback). */
  thinking?: boolean;
  /**
   * Per-request Anthropic model override (e.g. escalate hard/high-risk requests
   * to a stronger model). Falls back to the ANTHROPIC_MODEL env default.
   * See `@/lib/ai/model-router`.
   */
  model?: string;
  /** Token budget for extended thinking when enabled. Default 10000. */
  thinkingBudgetTokens?: number;
}

/** A tool the model may call. Mirrors the Anthropic tool schema. */
export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** Executes a tool the model requested and returns a string result. */
export type ToolRunner = (name: string, input: Record<string, unknown>) => Promise<string>;

export interface StreamChatWithToolsOptions extends StreamChatOptions {
  tools: ToolDef[];
  runTool: ToolRunner;
  /** Max tool→response round-trips before forcing a final answer. Default 6. */
  maxToolRounds?: number;
}

/** Classify an error as a transient/retryable provider blip vs. a hard failure. */
function isTransientError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | undefined;
  const status = e?.status;
  if (status === 408 || status === 409 || status === 429 || (typeof status === "number" && status >= 500)) {
    return true;
  }
  const msg = (e?.message ?? "").toLowerCase();
  return /overloaded|rate.?limit|timeout|timed out|econnreset|etimedout|enotfound|fetch failed|socket hang up|network|temporar/.test(
    msg,
  );
}

/**
 * Runs a streaming generator factory with a small retry budget. Retries only
 * when the error is transient AND nothing has been emitted yet — so a partially
 * streamed answer is never duplicated. Backs off between attempts.
 */
async function* withRetry(
  factory: () => AsyncGenerator<string>,
  attempts = 3,
): AsyncGenerator<string> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    let yielded = false;
    try {
      for await (const text of factory()) {
        yielded = true;
        yield text;
      }
      return;
    } catch (err) {
      if (yielded || attempt === attempts - 1 || !isTransientError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    }
  }
}

async function* streamAnthropic(opts: StreamChatOptions): AsyncGenerator<string> {
  const stream = anthropicClient().messages.stream({
    model: opts.model || ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.anthropicMessages,
    ...(opts.thinking
      ? { thinking: { type: "enabled", budget_tokens: opts.thinkingBudgetTokens ?? 10000 } }
      : {}),
  });
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      yield chunk.delta.text;
    }
  }
}

async function* streamOpenAI(opts: StreamChatOptions): AsyncGenerator<string> {
  const stream = await openaiClient().chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: opts.maxTokens,
    stream: true,
    messages: [{ role: "system", content: opts.system }, ...opts.openaiMessages],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/**
 * Streams assistant text, preferring Claude and falling back to OpenAI.
 * The fallback only triggers if Claude has not yet produced any output, so a
 * mid-stream failure is never duplicated across providers.
 */
export async function* streamChatText(opts: StreamChatOptions): AsyncGenerator<string> {
  const status = aiProviderStatus();
  if (!status.anthropic && !status.openai) {
    throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }

  if (status.anthropic) {
    let yielded = false;
    try {
      for await (const text of withRetry(() => streamAnthropic(opts))) {
        yielded = true;
        yield text;
      }
      return;
    } catch (err) {
      if (yielded || !status.openai) throw err;
      // Claude failed (after retries) before emitting anything — fall to OpenAI.
    }
  }

  yield* streamOpenAI(opts);
}

/**
 * Anthropic agentic loop: streams text and, when the model requests tools, runs
 * them, feeds the results back, and continues until the model produces a final
 * answer (or the round budget is exhausted). Text from every round is streamed
 * as it arrives.
 */
async function* streamAnthropicWithTools(opts: StreamChatWithToolsOptions): AsyncGenerator<string> {
  const messages: Anthropic.Messages.MessageParam[] = [...opts.anthropicMessages];
  const maxRounds = opts.maxToolRounds ?? 6;

  for (let round = 0; round < maxRounds; round++) {
    const isLastRound = round === maxRounds - 1;
    const stream = anthropicClient().messages.stream({
      model: opts.model || ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages,
      tools: opts.tools as unknown as Anthropic.Messages.Tool[],
      // On the final allowed round, forbid further tool calls so the model must
      // answer from what it already has.
      ...(isLastRound ? { tool_choice: { type: "none" as const } } : {}),
      ...(opts.thinking
        ? { thinking: { type: "enabled" as const, budget_tokens: opts.thinkingBudgetTokens ?? 10000 } }
        : {}),
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        yield chunk.delta.text;
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason !== "tool_use") return;

    const toolUses = final.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
    );
    if (toolUses.length === 0) return;

    // Preserve the assistant turn (incl. thinking + tool_use blocks) verbatim.
    messages.push({ role: "assistant", content: final.content });

    const results: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      let content: string;
      try {
        content = await opts.runTool(tu.name, (tu.input ?? {}) as Record<string, unknown>);
      } catch (err) {
        content = `Error running tool: ${(err as Error).message}`;
      }
      results.push({ type: "tool_result", tool_use_id: tu.id, content });
    }
    messages.push({ role: "user", content: results });
  }
}

/**
 * Streams an assistant answer with live tool access. Claude drives the agentic
 * loop (calling HR data tools as needed). If Claude is unconfigured or fails
 * before emitting anything, falls back to a plain OpenAI text answer WITHOUT
 * tools (degraded — no live data, but still responsive).
 */
export async function* streamChatWithTools(opts: StreamChatWithToolsOptions): AsyncGenerator<string> {
  const status = aiProviderStatus();
  if (!status.anthropic && !status.openai) {
    throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }

  if (status.anthropic) {
    let yielded = false;
    try {
      for await (const text of withRetry(() => streamAnthropicWithTools(opts))) {
        yielded = true;
        yield text;
      }
      return;
    } catch (err) {
      if (yielded || !status.openai) throw err;
      // Claude failed (after retries) before emitting anything — fall to OpenAI.
    }
  }

  yield* streamOpenAI(opts);
}
