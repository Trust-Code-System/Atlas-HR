/**
 * Knowledge-base ingestion — turns an uploaded document (PDF / DOCX / TXT / MD)
 * or pasted text into searchable chunks for RAG.
 *
 * Pipeline: extract text → chunk → store in kb_documents + kb_chunks (service-role).
 * Retrieval lives in ./retrieve.ts. Embeddings are intentionally left null — the
 * schema is pgvector-ready and Postgres full-text search powers retrieval today.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type KbSource = "policy_library" | "upload" | "chat";

const MAX_CHARS = 1_000; // target chunk size
const OVERLAP = 150; // characters of overlap between chunks

/** Extract plain text from a file buffer based on its media type / extension. */
export async function extractText(
  buffer: Buffer,
  mediaType: string | null,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();
  const type = (mediaType ?? "").toLowerCase();

  if (type.includes("pdf") || lower.endsWith(".pdf")) {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n\n") : text;
  }

  if (
    type.includes("wordprocessingml") ||
    type.includes("msword") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".doc")
  ) {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  // text / markdown / anything else — treat as UTF-8 text.
  return buffer.toString("utf-8");
}

export interface TextChunk {
  index: number;
  content: string;
  tokenEstimate: number;
}

/**
 * Split text into ~1000-char chunks with ~150-char overlap, preferring paragraph
 * boundaries so chunks stay semantically coherent.
 */
export function chunkText(raw: string): TextChunk[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  if (!text) return [];

  // Split into paragraphs, then greedily pack into chunks.
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > MAX_CHARS) {
      // Paragraph itself too long — hard-split on sentence/space boundaries.
      flush();
      let start = 0;
      while (start < para.length) {
        const end = Math.min(start + MAX_CHARS, para.length);
        chunks.push(para.slice(start, end).trim());
        start = end - OVERLAP > start ? end - OVERLAP : end;
      }
      continue;
    }
    if (current.length + para.length + 2 > MAX_CHARS) {
      // Carry the tail of the current chunk as overlap context.
      const tail = current.slice(-OVERLAP);
      flush();
      current = tail ? `${tail}\n\n${para}` : para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  flush();

  return chunks.map((content, index) => ({
    index,
    content,
    tokenEstimate: Math.ceil(content.length / 4),
  }));
}

export interface IngestArgs {
  orgId: string;
  title: string;
  category?: string;
  source: KbSource;
  /** policy_library.id when source = 'policy_library'. */
  sourceId?: string | null;
  /** Provide either a file buffer (+ media type / name) or raw text. */
  buffer?: Buffer;
  mediaType?: string | null;
  fileName?: string | null;
  text?: string;
  byteSize?: number | null;
  createdBy?: string | null;
}

export interface IngestResult {
  documentId: string | null;
  chunkCount: number;
  status: "ready" | "failed";
  error?: string;
}

/**
 * Ingest a document: create the kb_documents row, extract + chunk text, insert
 * kb_chunks. Uses the service-role client so it works from server actions and
 * API routes regardless of the caller's RLS context (the caller is responsible
 * for authorising the org / admin check first).
 */
export async function ingestDocument(args: IngestArgs): Promise<IngestResult> {
  const admin = createAdminClient();

  const { data: doc, error: docErr } = await admin
    .from("kb_documents")
    .insert({
      org_id: args.orgId,
      title: args.title,
      source: args.source,
      source_id: args.sourceId ?? null,
      category: args.category ?? "general",
      file_name: args.fileName ?? null,
      byte_size: args.byteSize ?? null,
      status: "pending",
      created_by: args.createdBy ?? null,
    })
    .select("id")
    .single();

  if (docErr || !doc) {
    return { documentId: null, chunkCount: 0, status: "failed", error: docErr?.message };
  }

  try {
    let text = args.text ?? "";
    if (!text && args.buffer) {
      text = await extractText(args.buffer, args.mediaType ?? null, args.fileName ?? "");
    }
    text = text.trim();
    if (!text) throw new Error("No extractable text found in the document.");

    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("Document produced no chunks.");

    const rows = chunks.map((c) => ({
      document_id: doc.id,
      org_id: args.orgId,
      chunk_index: c.index,
      content: c.content,
      token_estimate: c.tokenEstimate,
    }));

    // Insert in batches to stay well under payload limits for large handbooks.
    for (let i = 0; i < rows.length; i += 200) {
      const { error: chunkErr } = await admin.from("kb_chunks").insert(rows.slice(i, i + 200));
      if (chunkErr) throw new Error(chunkErr.message);
    }

    await admin
      .from("kb_documents")
      .update({ status: "ready", chunk_count: chunks.length, updated_at: new Date().toISOString() })
      .eq("id", doc.id);

    return { documentId: doc.id, chunkCount: chunks.length, status: "ready" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed.";
    await admin
      .from("kb_documents")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", doc.id);
    return { documentId: doc.id, chunkCount: 0, status: "failed", error: message };
  }
}

/** Delete a kb_documents row (and its chunks via FK cascade) for a policy source. */
export async function deleteKbDocumentBySource(
  orgId: string,
  source: KbSource,
  sourceId: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("kb_documents")
    .delete()
    .eq("org_id", orgId)
    .eq("source", source)
    .eq("source_id", sourceId);
}
