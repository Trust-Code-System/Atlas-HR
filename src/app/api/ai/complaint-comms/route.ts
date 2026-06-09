import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";

const AUDIENCES = {
  reporter: "the person who raised the complaint — acknowledge receipt, explain next steps and confidentiality, set expectations on timing. Do not promise an outcome.",
  subject: "the person the complaint is about — neutrally inform them a concern has been raised, that no conclusions have been drawn, outline the process and their right to respond. Avoid detail that could identify the reporter.",
  manager: "a line manager who needs to be looped in — factual, confidential briefing on the process and what is expected of them. Avoid sharing sensitive identifying detail beyond what is necessary.",
  summary: "an internal case file note — a neutral, factual record of the complaint and recommended next steps for the HR file.",
} as const;

const querySchema = z.object({
  id: z.string().uuid(),
  audience: z.enum(["reporter", "subject", "manager", "summary"]),
});

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      audience: req.nextUrl.searchParams.get("audience"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    // RLS guards visibility — if the user can't read it, they can't draft comms for it.
    const supabase = await createClient();
    const { data: complaint } = await supabase
      .from("complaints")
      .select("id, org_id, title, description, category, severity, status, is_anonymous")
      .eq("id", parsed.data.id)
      .single();
    if (!complaint || complaint.org_id !== orgCtx.org.id) {
      return NextResponse.json({ error: "Not found or not permitted" }, { status: 404 });
    }

    const system = `You are an HR professional drafting confidential, legally careful, neutral communications about a workplace complaint. Write for: ${AUDIENCES[parsed.data.audience]}

Rules:
- Neutral and factual. Presume nothing — no conclusions about who is right.
- Protect confidentiality; never reveal more than necessary${complaint.is_anonymous ? "; the reporter is ANONYMOUS — never include anything that could identify them" : ""}.
- Professional, calm, supportive tone.
- Output a ready-to-send message (or file note for the summary audience) in markdown. Use [PLACEHOLDER] for names/dates you don't have.
- End sensitive communications with a one-line note recommending HR/legal review before sending.`;

    const prompt = `Draft the communication for this complaint.\n\nTitle: ${complaint.title}\nCategory: ${complaint.category} · Severity: ${complaint.severity} · Status: ${complaint.status}\n\nDescription:\n${complaint.description}`;

    return streamCompletionResponse({ system, prompt, maxTokens: 1100 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_complaint_comms" } });
    return NextResponse.json({ error: "Failed to draft communication" }, { status: 500 });
  }
}
