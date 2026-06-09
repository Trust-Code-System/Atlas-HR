import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";

const SYSTEM_PROMPT = `You advise an HR approver on a single pending leave request. You are given the request, the employee's recent leave history, and who else on the team is already off during the same dates.

Write a SHORT markdown note (no headings beyond bold labels):

**Recommendation:** Approve / Approve with caution / Review needed — one line.
**Why:** 2–4 short bullets citing the specific signals (overlap with teammates, frequency/clustering of recent leave, length of request, notice given).
**Watch-outs:** only if relevant (coverage gaps, back-to-back leave, short notice).

Be balanced and factual — this is decision support, not a decision. Do not invent policy or entitlement figures you weren't given. Keep it under ~120 words.`;

const querySchema = z.object({ id: z.string().uuid() });

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse({ id: req.nextUrl.searchParams.get("id") });
    if (!parsed.success) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

    const orgCtx = await getCurrentOrg();
    if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const supabase = await createClient();

    const { data: request } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", parsed.data.id)
      .single();
    if (!request) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const { data: employee } = await supabase
      .from("employees")
      .select("id, full_name, job_title, department, org_id")
      .eq("id", request.employee_id)
      .eq("org_id", orgCtx.org.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

    // Team roster for overlap detection.
    const { data: orgEmployees } = await supabase
      .from("employees")
      .select("id, full_name, department")
      .eq("org_id", orgCtx.org.id);
    const roster = orgEmployees ?? [];
    const orgEmpIds = roster.map((e) => e.id);
    const empById = new Map(roster.map((e) => [e.id, e]));

    // The employee's own approved/recent leave (last ~12 months) and all approved
    // leave that overlaps the requested window.
    const { data: allLeave } = orgEmpIds.length
      ? await supabase
          .from("leave_requests")
          .select("employee_id, leave_type, status, start_date, end_date")
          .in("employee_id", orgEmpIds)
      : { data: [] as Array<{ employee_id: string; leave_type: string; status: string; start_date: string; end_date: string }> };
    const leaves = allLeave ?? [];

    const reqStart = new Date(request.start_date);
    const reqEnd = new Date(request.end_date);
    const overlaps = leaves
      .filter((l) => l.status === "approved" && l.employee_id !== employee.id)
      .filter((l) => new Date(l.start_date) <= reqEnd && new Date(l.end_date) >= reqStart)
      .map((l) => ({
        name: empById.get(l.employee_id)?.full_name ?? "Teammate",
        same_department: empById.get(l.employee_id)?.department === employee.department,
        type: l.leave_type,
        start: l.start_date,
        end: l.end_date,
      }));

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const ownHistory = leaves
      .filter((l) => l.employee_id === employee.id && new Date(l.start_date) >= oneYearAgo)
      .map((l) => ({ type: l.leave_type, status: l.status, start: l.start_date, end: l.end_date }));

    const days = Math.ceil((reqEnd.getTime() - reqStart.getTime()) / 86400000) + 1;
    const noticeDays = Math.ceil((reqStart.getTime() - Date.now()) / 86400000);

    const payload = {
      today: new Date().toISOString().slice(0, 10),
      request: {
        employee: employee.full_name,
        role: employee.job_title,
        department: employee.department,
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        working_span_days: days,
        notice_days: noticeDays,
        reason: request.reason ?? null,
      },
      team_size: roster.length,
      overlapping_teammates_off: overlaps,
      employee_leave_last_12_months: ownHistory,
    };

    const prompt = `Advise on this pending leave request.\n\n<data>\n${JSON.stringify(payload, null, 2)}\n</data>`;
    return streamCompletionResponse({ system: SYSTEM_PROMPT, prompt, maxTokens: 500 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_leave_recommendation" } });
    return NextResponse.json({ error: "Failed to generate recommendation" }, { status: 500 });
  }
}
