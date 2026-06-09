import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";

const CATEGORIES = ["harassment", "discrimination", "bullying", "safety", "pay", "management", "policy", "interpersonal", "other"] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;

const bodySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(2).max(8000),
});

const resultSchema = z.object({
  category: z.enum(CATEGORIES),
  severity: z.enum(SEVERITIES),
  is_sensitive: z.boolean(),
  summary: z.string().max(600),
  rationale: z.string().max(400),
});

const SYSTEM_PROMPT = `You triage a workplace complaint for an HR team. You are given the title and description. Return ONLY JSON.

{"category": one of ${CATEGORIES.join(", ")},
 "severity": one of ${SEVERITIES.join(", ")},
 "is_sensitive": boolean,
 "summary": "neutral 1–2 sentence factual summary",
 "rationale": "one sentence on why this category/severity/sensitivity"}

Guidance:
- Pick the single best category.
- severity: "critical" for safety risk, violence, or serious harassment/discrimination; "high" for credible harassment/discrimination/bullying; "medium" for most interpersonal/management/pay issues; "low" for minor matters.
- is_sensitive = true when the matter involves harassment, discrimination, bullying, safety, retaliation, or anything where the reporter's or subject's identity must be tightly restricted. Otherwise false.
- Be neutral and non-judgemental. Do not assume guilt. Summarise only what is stated.`;

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Title and description are required." }, { status: 400 });

    const prompt = `Title: ${parsed.data.title}\n\nDescription:\n${parsed.data.description}`;
    const raw = await runCompletion({ system: SYSTEM_PROMPT, prompt, maxTokens: 500 });
    const result = resultSchema.safeParse(extractJson(raw));
    if (!result.success) return NextResponse.json({ error: "Couldn't classify — try again." }, { status: 422 });

    return NextResponse.json(result.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_complaint_classify" } });
    return NextResponse.json({ error: "Failed to classify complaint" }, { status: 500 });
  }
}
