import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";
import { getManagerContext } from "@/lib/ai/manager-context";

const SYSTEM_PROMPT = `You are the Manager Assistant inside Atlas HR. You help a people manager understand what's pending for their team and what to prioritise. You are given their direct reports and the items currently needing attention.

Write a brief, practical markdown response to "what's pending for my team?":

**Top priorities** — 2–4 bullets, most time-sensitive first (e.g. leave awaiting your approval, overdue tasks, submitted timesheets, open cases). Name the person and what's needed.
**Team status** — one line on overall load (who's about to be off, anything clustered).
**Suggested actions** — 2–3 concrete next steps.

Be concise and action-oriented. Only use the data provided — don't invent items. If nothing is pending, say the team is all clear and note anything worth a proactive check-in.`;

export async function GET() {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getManagerContext(supabase, orgCtx.org.id, user.id, user.email ?? null);
    if (!ctx.manages) {
      return NextResponse.json(
        { error: "You don't have any direct reports in Atlas yet. Once employees list you as their manager, your team brief will appear here." },
        { status: 404 }
      );
    }

    const payload = {
      today: new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      team_size: ctx.reports.length,
      reports: ctx.reports.map((r) => ({ name: r.full_name, role: r.job_title, status: r.status })),
      leave_awaiting_approval: ctx.pendingLeave,
      timesheets_awaiting_approval: ctx.pendingTimesheets,
      open_tasks: ctx.openTasks,
      open_disciplinary_cases: ctx.openCases,
    };

    const prompt = `Give me a brief on what's pending for my team.\n\n<team_data>\n${JSON.stringify(payload, null, 2)}\n</team_data>`;
    return streamCompletionResponse({ system: SYSTEM_PROMPT, prompt, maxTokens: 1100 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_manager_brief" } });
    return NextResponse.json({ error: "Failed to generate team brief" }, { status: 500 });
  }
}
