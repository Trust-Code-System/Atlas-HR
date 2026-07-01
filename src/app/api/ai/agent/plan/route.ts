import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { planAgentActions } from "@/lib/ai/agent/plan-actions";

/**
 * Atlas AI action planner — turns an instruction (or a chat answer) into a set
 * of PROPOSED actions for the user to review and approve. Nothing is executed
 * here; execution happens only via /api/ai/agent/execute after explicit
 * approval. Proposals are resolved to concrete entity ids and filtered to the
 * action types the user is allowed to perform, so the UI never offers something
 * that would be rejected. See lib/ai/agent/plan-actions.ts for the logic.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  instruction: z.string().min(1).max(8000),
});

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const supabase = await createClient();
    const result = await planAgentActions(
      { supabase, orgId: orgCtx.org.id, isAdmin: orgCtx.isAdmin },
      parsed.data.instruction,
    );

    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_agent_plan" } });
    return NextResponse.json({ error: "Could not plan actions" }, { status: 500 });
  }
}
