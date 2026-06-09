/**
 * Knowledge-base retrieval — grounds Atlas AI answers in the organisation's own
 * uploaded documents (handbook, policies, contracts).
 *
 * Uses the `match_kb_chunks` RPC (Postgres full-text ranking, org-scoped,
 * AI-enabled documents only). Empty-safe: any failure yields no hits so the
 * copilot degrades gracefully to its general knowledge.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface KbHit {
  chunkId: string;
  docId: string;
  docTitle: string;
  content: string;
  rank: number;
}

export interface KbSource {
  type: "document";
  title: string;
  docId: string;
}

/** Retrieve the most relevant chunks from the org's own documents for a query. */
export async function searchOrgKnowledge(
  supabase: SupabaseClient<Database>,
  orgId: string,
  query: string,
  limit = 6
): Promise<KbHit[]> {
  const trimmed = query.trim();
  if (!trimmed || orgId === "") return [];
  try {
    const { data, error } = await supabase.rpc("match_kb_chunks", {
      p_org_id: orgId,
      p_query: trimmed,
      p_match_count: limit,
    });
    if (error || !data) return [];
    return (data as Array<{
      chunk_id: string;
      document_id: string;
      doc_title: string;
      content: string;
      rank: number;
    }>).map((r) => ({
      chunkId: r.chunk_id,
      docId: r.document_id,
      docTitle: r.doc_title,
      content: r.content,
      rank: r.rank,
    }));
  } catch {
    return [];
  }
}

/**
 * Build a system-prompt grounding block + the source list to surface to the UI.
 * Enforces the §2 "no-guess / contact HR" behaviour when the answer isn't in the
 * excerpts.
 */
export function buildGroundingFragment(hits: KbHit[]): {
  systemFragment: string;
  sources: KbSource[];
} {
  if (hits.length === 0) return { systemFragment: "", sources: [] };

  // De-dupe sources by document while keeping all excerpts.
  const sources: KbSource[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    if (!seen.has(h.docId)) {
      seen.add(h.docId);
      sources.push({ type: "document", title: h.docTitle, docId: h.docId });
    }
  }

  const excerpts = hits
    .map((h, i) => `[${i + 1}] From "${h.docTitle}":\n${h.content}`)
    .join("\n\n");

  const systemFragment = `

--- This organisation's own documents ---
The following excerpts come from documents this organisation has uploaded (their handbook, policies, contracts). When the user asks about *this company's* policies or procedures, answer using ONLY these excerpts and cite the document title you relied on (e.g. "According to your Annual Leave Policy…").

If the answer is not contained in these excerpts, say clearly that you couldn't find it in the company's own documents and recommend the user contact their HR team — do NOT guess or fall back to generic policy. You may still give general best-practice guidance, but label it clearly as general guidance, not this company's policy.

${excerpts}`;

  return { systemFragment, sources };
}
