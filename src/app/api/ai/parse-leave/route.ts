import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";

const LEAVE_TYPES = [
  "annual", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid", "other",
] as const;

const bodySchema = z.object({ text: z.string().min(2).max(1000) });

const resultSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  leave_type: z.enum(LEAVE_TYPES).nullable(),
  reason: z.string().max(300).nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a short description of the leave." }, { status: 400 });

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });

    const system = `You convert a natural-language leave request into structured fields. Return ONLY a JSON object, no prose.

Today is ${weekday}, ${todayIso} (ISO YYYY-MM-DD). Interpret relative dates ("next week", "Mon to Fri", "tomorrow", "the 14th") against today. Weeks run Monday–Friday for working days; "next week" means the upcoming Monday–Friday unless the user says otherwise.

Fields:
- "start_date": ISO date or null if not determinable
- "end_date": ISO date (same as start for a single day) or null
- "leave_type": one of ${LEAVE_TYPES.join(", ")} — infer from wording ("doctor"/"unwell" → sick, "holiday"/"vacation" → annual, "new baby" → maternity/paternity), else "annual" if clearly time off, else null
- "reason": a short reason if the user gave one, else null

Output strictly: {"start_date": "...", "end_date": "...", "leave_type": "...", "reason": "..."}`;

    const raw = await runCompletion({ system, prompt: parsed.data.text, maxTokens: 300 });
    const json = extractJson(raw);
    const result = resultSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: "Couldn't understand that — try rephrasing the dates." }, { status: 422 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_parse_leave" } });
    return NextResponse.json({ error: "Failed to parse leave request" }, { status: 500 });
  }
}
