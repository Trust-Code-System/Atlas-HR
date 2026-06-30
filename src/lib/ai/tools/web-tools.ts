/**
 * Web-grounding tool for the Atlas AI copilot (agentic tool-use).
 *
 * Lets the assistant search the live web for things that are NOT in the
 * workspace's own data — current employment law, statutory rates, salary
 * benchmarks, HR best-practice and news — and answer with real citations.
 * Mirrors Microsoft 365 Copilot's web grounding.
 *
 * Only advertised when a search provider is configured (see web-search.ts), so
 * the model never calls a disabled tool.
 */
import type { ToolDef } from "@/lib/ai/provider";
import { webSearch, isWebSearchConfigured, WebSearchNotConfiguredError } from "@/lib/ai/web-search";

export const WEB_TOOL_NAMES = new Set(["web_search"]);

export const WEB_TOOLS: ToolDef[] = [
  {
    name: "web_search",
    description:
      "Search the live web for up-to-date, external information that is NOT in this workspace's own HR data — e.g. current employment law and statutory rates, notice-period rules, salary/market benchmarks, regulatory changes, or HR best-practice and news. Returns ranked passages with their source URLs. ALWAYS cite the source URL(s) you used in your answer, and prefer official/government sources for legal figures. Use this only for external facts; for the company's own people, policies and documents use the HR data tools instead.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The web search query." },
        recency: {
          type: "string",
          enum: ["any", "recent"],
          description: "Use 'recent' for time-sensitive facts (laws, rates, news) to favour a deeper search.",
        },
      },
      required: ["query"],
    },
  },
];

type Json = Record<string, unknown>;

/** Build a runner for the web tools. */
export function makeWebToolRunner() {
  return async function runWebTool(name: string, input: Json): Promise<string> {
    if (name !== "web_search") return JSON.stringify({ error: `Unknown web tool: ${name}` });
    if (!isWebSearchConfigured()) {
      return JSON.stringify({
        error: "Web search is not configured for this workspace. Answer from general knowledge and say it isn't from a live source.",
      });
    }
    const query = typeof input.query === "string" ? input.query : "";
    if (!query.trim()) return JSON.stringify({ error: "Provide a search query." });
    const depth = input.recency === "recent" ? ("advanced" as const) : ("basic" as const);
    try {
      const res = await webSearch(query, { depth, maxResults: 5 });
      return JSON.stringify({
        query: res.query,
        answer: res.answer,
        results: res.results.map((r) => ({ title: r.title, url: r.url, snippet: r.content })),
        instruction: "Cite the source URLs you rely on. Verify legal/statutory figures against official sources.",
      });
    } catch (err) {
      if (err instanceof WebSearchNotConfiguredError) {
        return JSON.stringify({ error: "Web search is not configured." });
      }
      return JSON.stringify({ error: `Web search failed: ${(err as Error).message}` });
    }
  };
}
