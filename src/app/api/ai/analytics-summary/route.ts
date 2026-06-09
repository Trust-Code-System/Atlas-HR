import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";

const SYSTEM_PROMPT = `You are an HR analytics partner. You are given aggregate, fully anonymous workforce metrics for one organisation (no individual employees). Write a crisp executive HR summary in markdown.

Structure:
**Headline** — 2–3 sentences capturing the state of the workforce this period.
**What's notable** — 3–5 bullets on the most important movements (headcount, hiring trend, leave pressure, concentration risks).
**Watch-outs** — 1–3 risks or anomalies the data hints at (e.g. pending-leave backlog, hiring slowdown, single-location concentration).
**Recommended focus** — 2–3 concrete, practical actions for the HR team this month.

Be specific with the numbers provided. Do not invent data you weren't given. Keep it tight — a busy HR lead should be able to read it in under a minute.`;

export async function GET() {
  try {
    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const supabase = await createClient();

    const { data: employees } = await supabase
      .from("employees")
      .select("id, department, status, employment_type, start_date, country")
      .eq("org_id", orgCtx.org.id);
    const emps = employees ?? [];
    const empIds = emps.map((e) => e.id);

    const { data: leaves } = empIds.length
      ? await supabase
          .from("leave_requests")
          .select("leave_type, status, start_date")
          .in("employee_id", empIds)
      : { data: [] as Array<{ leave_type: string; status: string; start_date: string }> };
    const allLeaves = leaves ?? [];

    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };
    const activeish = emps.filter((e) => e.status !== "terminated");

    const byKey = (rows: { k: string | null }[]) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(r.k ?? "Unknown", (m.get(r.k ?? "Unknown") ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    const monthly: { month: string; hires: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const hires = emps.filter((e) => e.start_date && new Date(e.start_date) >= start && new Date(e.start_date) <= end).length;
      monthly.push({ month: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), hires });
    }

    const metrics = {
      generated_on: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      organisation: orgCtx.org.name,
      headcount: {
        total: emps.length,
        active: emps.filter((e) => e.status === "active").length,
        on_leave: emps.filter((e) => e.status === "on_leave").length,
        terminated: emps.filter((e) => e.status === "terminated").length,
      },
      hiring: {
        new_hires_30d: emps.filter((e) => e.start_date && new Date(e.start_date) >= daysAgo(30)).length,
        new_hires_90d: emps.filter((e) => e.start_date && new Date(e.start_date) >= daysAgo(90)).length,
        monthly_trend: monthly,
      },
      by_department: byKey(activeish.map((e) => ({ k: e.department }))).slice(0, 10),
      by_employment_type: byKey(activeish.map((e) => ({ k: e.employment_type }))),
      by_country: byKey(activeish.map((e) => ({ k: e.country }))).slice(0, 8),
      leave: {
        pending: allLeaves.filter((l) => l.status === "pending").length,
        approved: allLeaves.filter((l) => l.status === "approved").length,
        rejected: allLeaves.filter((l) => l.status === "rejected").length,
        approved_by_type: byKey(allLeaves.filter((l) => l.status === "approved").map((l) => ({ k: l.leave_type }))),
      },
    };

    const prompt = `Produce this month's HR analytics summary from these metrics.\n\n<metrics>\n${JSON.stringify(metrics, null, 2)}\n</metrics>`;

    return streamCompletionResponse({ system: SYSTEM_PROMPT, prompt, maxTokens: 1400 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_analytics_summary" } });
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
