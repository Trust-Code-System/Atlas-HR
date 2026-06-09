import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { runCompletion, extractJson } from "@/lib/ai/run-completion";

const bodySchema = z.object({
  employeeId: z.string().uuid(),
  focus: z.string().max(300).optional(),
});

const resultSchema = z.object({
  title: z.string().max(160),
  severity: z.enum(["minor", "moderate", "serious", "gross_misconduct"]),
  description: z.string().max(4000),
});

const SYSTEM_PROMPT = `You draft the written record for a disciplinary case about attendance, for HR review. You are given an employee's logged attendance signals over the last 90 days and any prior cases.

Return ONLY JSON: {"title": "...", "severity": "minor|moderate|serious|gross_misconduct", "description": "..."}

- "title": short case title, e.g. "Attendance concern — repeated short-notice sick days".
- "severity": proportionate. A first-time pattern is usually "minor". Escalate only if prior cases exist.
- "description": a factual, neutral file note (not a letter to the employee). State the observed pattern with the figures provided, note it is based on logged time entries and should be verified, reference any prior cases, and recommend the next step (e.g. documented informal conversation, or formal first warning if prior warnings exist). No accusations about intent or character. ~120–200 words.

Be fair and evidence-based. Do not invent dates or figures beyond those provided.`;

export async function POST(req: NextRequest) {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Select an employee first." }, { status: 400 });

    const supabase = await createClient();

    const { data: employee } = await supabase
      .from("employees")
      .select("id, full_name, job_title, department")
      .eq("id", parsed.data.employeeId)
      .eq("org_id", orgCtx.org.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data: entries } = await supabase
      .from("time_entries")
      .select("date, hours, category")
      .eq("org_id", orgCtx.org.id)
      .eq("employee_id", employee.id)
      .gte("date", since.toISOString().slice(0, 10));
    const rows = entries ?? [];

    const sick = rows.filter((r) => r.category === "sick");
    const sickAdjWeekend = sick.filter((r) => [1, 5].includes(new Date(r.date).getDay())).length;

    const { data: priorCases } = await supabase
      .from("disciplinary_cases")
      .select("type, severity, title, status, incident_date")
      .eq("org_id", orgCtx.org.id)
      .eq("employee_id", employee.id)
      .order("incident_date", { ascending: false })
      .limit(10);

    const payload = {
      employee: { name: employee.full_name, role: employee.job_title, department: employee.department },
      focus: parsed.data.focus ?? "attendance / absence pattern",
      period_days: 90,
      signals: {
        logged_days: rows.length,
        sick_days: sick.length,
        sick_dates: sick.map((r) => r.date),
        sick_days_adjacent_to_weekend: sickAdjWeekend,
        overtime_days: rows.filter((r) => r.category === "overtime").length,
      },
      prior_cases: priorCases ?? [],
    };

    const prompt = `Draft the attendance case record.\n\n<data>\n${JSON.stringify(payload, null, 2)}\n</data>`;
    const raw = await runCompletion({ system: SYSTEM_PROMPT, prompt, maxTokens: 700 });
    const result = resultSchema.safeParse(extractJson(raw));
    if (!result.success) {
      return NextResponse.json({ error: "Couldn't generate a draft — try again." }, { status: 422 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_attendance_warning" } });
    return NextResponse.json({ error: "Failed to draft warning note" }, { status: 500 });
  }
}
