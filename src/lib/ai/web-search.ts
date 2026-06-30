/**
 * Web search provider for Atlas AI — gives the copilot live web grounding
 * (employment-law updates, salary benchmarks, HR trends) with citations, the
 * way Microsoft 365 Copilot grounds answers in Bing.
 *
 * Pluggable by provider; Tavily is the default because it returns clean,
 * LLM-ready passages. Configure with an env key (no app secret is committed):
 *   - TAVILY_API_KEY   (default provider)
 * If no key is set, web search is simply unavailable and the tool reports that
 * cleanly — the copilot falls back to its general knowledge.
 */

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface WebSearchResponse {
  query: string;
  answer?: string;
  results: WebSearchResult[];
}

export class WebSearchNotConfiguredError extends Error {
  constructor() {
    super("Web search is not configured. Set TAVILY_API_KEY to enable it.");
    this.name = "WebSearchNotConfiguredError";
  }
}

/** Whether a web-search provider is configured for this deployment. */
export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

interface TavilyRaw {
  answer?: string;
  results?: { title?: string; url?: string; content?: string; score?: number }[];
}

/**
 * Run a web search and return ranked passages (+ an optional synthesized
 * answer). Throws WebSearchNotConfiguredError when no provider key is present;
 * other failures throw a generic Error the caller can surface gracefully.
 */
export async function webSearch(
  query: string,
  opts: { maxResults?: number; depth?: "basic" | "advanced" } = {},
): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new WebSearchNotConfiguredError();

  const trimmed = query.trim();
  if (!trimmed) return { query: trimmed, results: [] };

  const maxResults = Math.max(1, Math.min(opts.maxResults ?? 5, 8));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: trimmed,
        max_results: maxResults,
        search_depth: opts.depth ?? "basic",
        include_answer: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Web search provider returned ${res.status}`);
    }
    const data = (await res.json()) as TavilyRaw;
    return {
      query: trimmed,
      answer: data.answer,
      results: (data.results ?? [])
        .filter((r) => r.url)
        .slice(0, maxResults)
        .map((r) => ({
          title: r.title ?? r.url ?? "Result",
          url: r.url ?? "",
          content: (r.content ?? "").slice(0, 1200),
          score: r.score,
        })),
    };
  } finally {
    clearTimeout(timeout);
  }
}
