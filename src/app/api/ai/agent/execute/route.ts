import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { hasAnyPermission } from "@/lib/auth/permissions";
import {
  agentActionSchema,
  AGENT_ACTION_PERMISSIONS,
  executeAgentAction,
} from "@/lib/ai/agent/agent-actions";

/**
 * Execute ONE Atlas AI action that the user has explicitly approved. This is
 * the only place a proposed action is performed. It re-validates the action
 * shape and the user's permission server-side (never trusting the client) and
 * writes the action through the audited executor.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({ action: agentActionSchema });

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    const { action } = parsed.data;

    // Re-check permission for this specific action type — approval in the UI is
    // not authority; the server is.
    const allowed =
      orgCtx.isAdmin || (await hasAnyPermission(orgCtx.org.id, AGENT_ACTION_PERMISSIONS[action.type]));
    if (!allowed) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await executeAgentAction(supabase, orgCtx.org.id, user.id, action);
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_agent_execute" } });
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
