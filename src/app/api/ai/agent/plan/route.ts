import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";
import {
  agentActionSchema,
  AGENT_ACTION_PERMISSIONS,
  AGENT_ACTION_LABELS,
  type AgentAction,
  type AgentActionType,
} from "@/lib/ai/agent/agent-actions";

/**
 * Atlas AI action planner — turns an instruction (or a chat answer) into a set
 * of PROPOSED actions for the user to review and approve. Nothing is executed
 * here; execution happens only via /api/ai/agent/execute after explicit
 * approval. Proposals are filtered to the action types the user is allowed to
 * perform, so the UI never offers something that would be rejected.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  instruction: z.string().min(1).max(8000),
});

const SYSTEM = `You are Atlas AI's action planner. Convert the user's request into concrete, safe, reversible workspace actions for a human to approve. You do NOT execute anything.

Only ever output these action types:
- "create_tasks": one or more workspace to-do tasks. Each task has a short "title", optional "description", optional "due_at" (YYYY-MM-DD).
- "create_announcement": a single company announcement with a "title" and "body".

Rules:
- Never propose terminations, pay changes, deletions, sending external email, or bulk personal-data changes — those are out of scope.
- Only propose actions clearly implied by the request. If nothing actionable is present, return an empty list.
- Keep titles short and imperative. Infer sensible due dates only if the user mentions timing; otherwise omit due_at.
- Respond with ONLY valid JSON, no prose, in exactly this shape:
{"actions":[ { "type":"create_tasks", "summary":"...", "tasks":[ {"title":"...","description":"...","due_at":"YYYY-MM-DD"} ] } ]}`;

const planSchema = z.object({ actions: z.array(agentActionSchema).max(10) });

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const raw = await runCompletion({
      system: SYSTEM,
      prompt: parsed.data.instruction,
      maxTokens: 2000,
    });
    const json = extractJson<unknown>(raw);
    const result = planSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ actions: [], note: "No actionable steps detected." });
    }

    // Permission-filter: only keep actions this user is actually allowed to run.
    const allowedByType = new Map<AgentActionType, boolean>();
    for (const type of Object.keys(AGENT_ACTION_PERMISSIONS) as AgentActionType[]) {
      allowedByType.set(
        type,
        orgCtx.isAdmin || (await hasAnyPermission(orgCtx.org.id, AGENT_ACTION_PERMISSIONS[type])),
      );
    }
    const actions = result.data.actions.filter((a: AgentAction) => allowedByType.get(a.type));

    return NextResponse.json({
      actions,
      labels: AGENT_ACTION_LABELS,
      note:
        actions.length === 0
          ? result.data.actions.length > 0
            ? "You don't have permission to perform the suggested actions."
            : "No actionable steps detected — this looks informational."
          : undefined,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_agent_plan" } });
    return NextResponse.json({ error: "Could not plan actions" }, { status: 500 });
  }
}
