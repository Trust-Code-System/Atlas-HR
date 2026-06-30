import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { markdownToDocx } from "@/lib/ai/documents/docx-generator";
import { markdownToXlsx } from "@/lib/ai/documents/xlsx-generator";
import { markdownToPptx } from "@/lib/ai/documents/pptx-generator";
import { markdownToPdf } from "@/lib/ai/documents/pdf-generator";

/**
 * Atlas AI document export — turns a chat answer (Markdown) into a real
 * Microsoft Office file: Word (.docx), Excel (.xlsx) or PowerPoint (.pptx).
 *
 * This is what gives Atlas AI the "create a real deliverable" ability of
 * Microsoft 365 Copilot, instead of only rendering Markdown on screen.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  format: z.enum(["docx", "xlsx", "pptx", "pdf"]),
  content: z.string().min(1).max(120000),
  title: z.string().max(180).optional(),
});

const META: Record<z.infer<typeof bodySchema>["format"], { contentType: string; ext: string }> = {
  docx: {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
  },
  xlsx: {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
  },
  pptx: {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: "pptx",
  },
  pdf: {
    contentType: "application/pdf",
    ext: "pdf",
  },
};

function safeFilename(title: string, ext: string): string {
  const base = title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 60);
  return `${base || "atlas-document"}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticated users only — these exports may contain workspace data.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
    }
    const { format, content } = parsed.data;
    const title = (parsed.data.title ?? "Atlas Document").trim() || "Atlas Document";
    const meta = META[format];

    let buffer: Buffer;
    if (format === "docx") buffer = await markdownToDocx(content, title);
    else if (format === "xlsx") buffer = await markdownToXlsx(content, title);
    else if (format === "pptx") buffer = await markdownToPptx(content, title);
    else buffer = await markdownToPdf(content, title);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": meta.contentType,
        "Content-Disposition": `attachment; filename="${safeFilename(title, meta.ext)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_document" } });
    return new Response(JSON.stringify({ error: "Document generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
