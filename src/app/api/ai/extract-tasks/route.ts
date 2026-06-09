import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";

const TASK_TYPES = [
  "profile_update", "document_upload", "policy_acknowledgment", "training",
  "onboarding", "offboarding", "leave", "custom",
] as const;

const bodySchema = z.object({ text: z.string().min(10).max(12000) });

const resultSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).nullable(),
        task_type: z.enum(TASK_TYPES),
        due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
        assignee_hint: z.string().max(120).nullable(),
      })
    )
    .max(25),
});

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Paste some notes to extract tasks from." }, { status: 400 });

    const todayIso = new Date().toISOString().slice(0, 10);
    const system = `You extract actionable HR tasks and reminders from free-form text (meeting notes, an email, or rough notes). Today is ${todayIso} (ISO).

Return ONLY JSON: {"tasks": [{"title": "...", "description": "...", "task_type": "...", "due_at": "YYYY-MM-DD" or null, "assignee_hint": "name mentioned" or null}]}

Rules:
- Extract only genuine action items / follow-ups / reminders — not background discussion.
- "title": short imperative ("Send updated contract to Maria").
- "description": one sentence of useful context, or null.
- "task_type": choose the closest of ${TASK_TYPES.join(", ")}; use "custom" if none fit.
- "due_at": resolve relative dates ("by Friday", "next week", "end of month") against today; null if no date implied.
- "assignee_hint": a person's name if the text says who owns it, else null. Do NOT invent names.
- If there are no real tasks, return {"tasks": []}.`;

    const raw = await runCompletion({ system, prompt: parsed.data.text, maxTokens: 1500 });
    const result = resultSchema.safeParse(extractJson(raw));
    if (!result.success) {
      return NextResponse.json({ error: "Couldn't extract tasks — try clearer notes." }, { status: 422 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_extract_tasks" } });
    return NextResponse.json({ error: "Failed to extract tasks" }, { status: 500 });
  }
}
