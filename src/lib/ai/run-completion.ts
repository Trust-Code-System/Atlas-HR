/**
 * Convenience wrappers over the streaming provider for the many AI features that
 * just need "system + prompt → text" without re-implementing stream draining.
 *
 * Use `runCompletion` when you want the whole string (server actions, JSON
 * extraction). Use `streamCompletion` to pipe a plain-text SSE-free stream to a
 * Response (one-shot AI panels). Both go through `streamChatText`, so they keep
 * the Claude→OpenAI fallback.
 */

import { streamChatText } from "@/lib/ai/provider";

export interface CompletionOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

/** Run a single-turn completion and return the full text. */
export async function runCompletion(opts: CompletionOptions): Promise<string> {
  let out = "";
  for await (const chunk of streamChatText({
    system: opts.system,
    anthropicMessages: [{ role: "user", content: opts.prompt }],
    openaiMessages: [{ role: "user", content: opts.prompt }],
    maxTokens: opts.maxTokens ?? 2048,
  })) {
    out += chunk;
  }
  return out;
}

/** Build a plain-text streaming Response for a single-turn completion. */
export function streamCompletionResponse(opts: CompletionOptions): Response {
  const encoder = new TextEncoder();
  const aiStream = streamChatText({
    system: opts.system,
    anthropicMessages: [{ role: "user", content: opts.prompt }],
    openaiMessages: [{ role: "user", content: opts.prompt }],
    maxTokens: opts.maxTokens ?? 2048,
  });
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of aiStream) controller.enqueue(encoder.encode(text));
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

/**
 * Extract a JSON object from a model response. Models sometimes wrap JSON in
 * prose or ```json fences — this finds and parses the first balanced object.
 * Returns null if nothing parseable is found.
 */
export function extractJson<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
