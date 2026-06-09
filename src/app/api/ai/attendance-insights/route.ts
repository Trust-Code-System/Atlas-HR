import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";

const SYSTEM_PROMPT = `You are an HR attendance analyst. You are given, for one organisation, each employee's logged time entries over the last 90 days (category, hours, dates) plus simple derived signals. Identify genuine attendance patterns and risks.

Important: the data is *logged time entries*, which may be incomplete. Flag patterns as signals to look into, not proven facts. Never accuse — recommend a conversation or documentation where appropriate.

Write a markdown report:

**Overview** — 2–3 sentences on overall attendance health.

**Patterns to look at** — for each notable employee (max ~6), a short bullet: name — the pattern (e.g. "4 sick days, 3 of them adjacent to a weekend", "frequent single-day absences", "repeated low-hours days") — and a suggested next step (informal check-in / documented conversation / monitor).

**Recommended actions** — 2–3 org-level steps (e.g. clarify sick-leave reporting, monitor a team).

If nothing stands out, say attendance looks healthy and stop. Keep it concise and fair.`;

export async function GET() {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const supabase = await createClient();

    const { data: employees } = await supabase
      .from("employees")
      .select("id, full_name, department")
      .eq("org_id", orgCtx.org.id)
      .eq("status", "active");
    const emps = employees ?? [];
    if (emps.length === 0) {
      return NextResponse.json({ error: "No active employees to analyse yet." }, { status: 404 });
    }
    const empById = new Map(emps.map((e) => [e.id, e]));

    const since = new Date();
    since.setDate(since.getDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data: entries } = await supabase
      .from("time_entries")
      .select("employee_id, date, hours, category")
      .eq("org_id", orgCtx.org.id)
      .gte("date", sinceStr);
    const rows = entries ?? [];

    const dow = (d: string) => new Date(d).getDay(); // 0=Sun … 6=Sat

    const perEmp = new Map<string, {
      name: string; department: string | null;
      logged_days: number; total_hours: number;
      sick_days: number; sick_dates: string[]; sick_adjacent_to_weekend: number;
      overtime_days: number; low_hours_days: number;
    }>();

    for (const e of emps) {
      perEmp.set(e.id, {
        name: e.full_name, department: e.department,
        logged_days: 0, total_hours: 0,
        sick_days: 0, sick_dates: [], sick_adjacent_to_weekend: 0,
        overtime_days: 0, low_hours_days: 0,
      });
    }

    for (const r of rows) {
      const agg = perEmp.get(r.employee_id);
      if (!agg) continue;
      agg.logged_days += 1;
      agg.total_hours += r.hours ?? 0;
      if (r.category === "sick") {
        agg.sick_days += 1;
        agg.sick_dates.push(r.date);
        const d = dow(r.date);
        if (d === 1 || d === 5) agg.sick_adjacent_to_weekend += 1; // Mon or Fri
      }
      if (r.category === "overtime") agg.overtime_days += 1;
      if ((r.hours ?? 0) > 0 && (r.hours ?? 0) < 4 && r.category === "regular") agg.low_hours_days += 1;
    }

    // Only surface employees with any attendance signal worth analysing.
    const flagged = [...perEmp.entries()]
      .map(([id, a]) => ({ id, ...a }))
      .filter((a) => a.sick_days > 0 || a.low_hours_days > 0 || a.overtime_days >= 5)
      .sort((a, b) => b.sick_days - a.sick_days)
      .slice(0, 12)
      .map(({ id: _id, ...rest }) => rest);

    void empById;

    const payload = {
      period: { from: sinceStr, to: new Date().toISOString().slice(0, 10), days: 90 },
      active_employees: emps.length,
      total_time_entries: rows.length,
      employees_with_signals: flagged,
    };

    const prompt = `Analyse this organisation's attendance over the last 90 days.\n\n<data>\n${JSON.stringify(payload, null, 2)}\n</data>`;
    return streamCompletionResponse({ system: SYSTEM_PROMPT, prompt, maxTokens: 1300 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_attendance_insights" } });
    return NextResponse.json({ error: "Failed to analyse attendance" }, { status: 500 });
  }
}
