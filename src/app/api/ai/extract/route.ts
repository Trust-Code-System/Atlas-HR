import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import mammoth from "mammoth";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

/**
 * Extract plain text from an uploaded Word (.docx) or PowerPoint (.pptx) file so
 * Atlas AI can summarize / answer questions about / compare it. The LLM can't
 * read these binary Office formats directly, so the client uploads the file
 * here, gets text back, and attaches that text to the chat.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 120000; // matches the copilot route's text-attachment limit

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Pull readable text from a .pptx by reading each slide's <a:t> runs in order. */
async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });

  const slides: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.file(name)!.async("string");
    const texts = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)).map((m) => decodeXml(m[1]));
    if (texts.length) slides.push(`Slide ${slides.length + 1}:\n${texts.join("\n")}`);
  }
  return slides.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });

    const name = file.name;
    const lower = name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";
    if (lower.endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (lower.endsWith(".pptx")) {
      text = await extractPptxText(buffer);
    } else {
      return NextResponse.json({ error: "Unsupported file. Upload a .docx or .pptx." }, { status: 400 });
    }

    text = text.replace(/\n{3,}/g, "\n\n").trim();
    if (!text) return NextResponse.json({ error: "No readable text found in the file." }, { status: 422 });

    return NextResponse.json({ name, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_extract" } });
    return NextResponse.json({ error: "Could not read that file." }, { status: 500 });
  }
}
