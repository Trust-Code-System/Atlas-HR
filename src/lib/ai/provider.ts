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
}

async function* streamAnthropic(opts: StreamChatOptions): AsyncGenerator<string> {
  const stream = anthropicClient().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.anthropicMessages,
    ...(opts.thinking ? { thinking: { type: "enabled", budget_tokens: 10000 } } : {}),
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
      for await (const text of streamAnthropic(opts)) {
        yielded = true;
        yield text;
      }
      return;
    } catch (err) {
      if (yielded || !status.openai) throw err;
      // Claude failed before emitting anything — fall through to OpenAI.
    }
  }

  yield* streamOpenAI(opts);
}
