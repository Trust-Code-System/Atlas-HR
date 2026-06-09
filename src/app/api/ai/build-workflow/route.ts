import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";

const TRIGGERS = ["document_expiring", "contract_ending", "new_hire", "leave_pending"] as const;
const ACTIONS = ["notify_hr", "notify_manager", "create_task"] as const;

const bodySchema = z.object({ text: z.string().min(5).max(600) });

const resultSchema = z.object({
  name: z.string().min(2).max(120),
  trigger_type: z.enum(TRIGGERS),
  trigger_days: z.number().int().min(0).max(365),
  action_type: z.enum(ACTIONS),
  action_config: z.object({
    task_title: z.string().max(160).nullable().optional(),
    message: z.string().max(400).nullable().optional(),
  }),
  explanation: z.string().max(400),
});

const SYSTEM_PROMPT = `You turn a natural-language HR automation rule into a structured workflow. Return ONLY JSON.

Available triggers (pick the closest):
- "document_expiring": an employee document is within N days of expiry.
- "contract_ending": an employee's contract end date is within N days.
- "new_hire": an employee started within the last N days.
- "leave_pending": a leave request has been pending for more than N days.

Available actions:
- "notify_hr": send an in-app notification to HR admins.
- "notify_manager": notify the affected employee's manager.
- "create_task": create an HR task about the affected employee.

JSON shape:
{"name": "short title",
 "trigger_type": one of the triggers,
 "trigger_days": integer (the N above; default 30 if unspecified, 0 for same-day),
 "action_type": one of the actions,
 "action_config": {"task_title": "..." (only for create_task), "message": "short notification text"},
 "explanation": "one plain-English sentence describing what this will do"}

Map the user's intent to the closest supported trigger/action. If they ask for something unsupported, choose the nearest supported combination and say so in the explanation.`;

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Describe the rule you want." }, { status: 400 });

    const raw = await runCompletion({ system: SYSTEM_PROMPT, prompt: parsed.data.text, maxTokens: 400 });
    const result = resultSchema.safeParse(extractJson(raw));
    if (!result.success) {
      return NextResponse.json({ error: "Couldn't turn that into a workflow — try rephrasing." }, { status: 422 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_build_workflow" } });
    return NextResponse.json({ error: "Failed to build workflow" }, { status: 500 });
  }
}
