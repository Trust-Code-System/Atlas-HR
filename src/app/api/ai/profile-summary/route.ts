import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { aiProviderStatus } from "@/lib/ai/provider";
import { streamCompletionResponse } from "@/lib/ai/run-completion";

const SYSTEM_PROMPT = `You are an HR analyst writing a concise, factual one-page profile summary for a manager or HR partner. You are given structured data about a single employee.

Write a clear markdown summary with these sections (omit a section if there is no data for it):

**Snapshot** — 2–3 sentences: who they are, role, tenure, current status.
**Leave** — pattern across their requests (frequency, types, anything notable). State facts only.
**Performance** — summarise review ratings/notes if present.
**Flags & follow-ups** — disciplinary cases, expiring documents, or gaps worth a manager's attention.
**Suggested next steps** — 2–3 practical, neutral actions.

Be factual and fair — no speculation about personality or protected characteristics. Base everything on the data provided. If data is sparse, say so briefly rather than inventing detail.`;

const querySchema = z.object({ id: z.string().uuid() });

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse({ id: req.nextUrl.searchParams.get("id") });
    if (!parsed.success) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });

    const orgCtx = await getCurrentOrg();
    if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = aiProviderStatus();
    if (!status.anthropic && !status.openai) {
      return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
    }

    const supabase = await createClient();
    const { id } = parsed.data;

    const { data: employee } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgCtx.org.id)
      .single();
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Authorisation: org admins, or the employee's manager.
    let allowed = orgCtx.isAdmin;
    if (!allowed) {
      const { data: canManage } = await supabase.rpc("manages_employee", { _employee_id: id });
      allowed = Boolean(canManage);
    }
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [manager, leave, docs, reviews, cases] = await Promise.all([
      employee.manager_id
        ? supabase.from("employees").select("full_name, job_title").eq("id", employee.manager_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("leave_requests").select("leave_type, status, start_date, end_date").eq("employee_id", id).order("start_date", { ascending: false }).limit(20),
      supabase.from("employee_documents").select("doc_type, file_name, expires_at, ai_enabled").eq("employee_id", id).neq("ai_enabled", false),
      supabase.from("performance_reviews").select("*").eq("employee_id", id).order("created_at", { ascending: false }).limit(6),
      supabase.from("disciplinary_cases").select("type, severity, title, status, incident_date, outcome").eq("employee_id", id).order("incident_date", { ascending: false }).limit(10),
    ]);

    const fmt = (d: string | null | undefined) =>
      d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

    const data = {
      employee: {
        full_name: employee.full_name,
        job_title: employee.job_title,
        department: employee.department,
        employment_type: employee.employment_type,
        status: employee.status,
        country: employee.country,
        start_date: fmt(employee.start_date),
        end_date: fmt(employee.end_date),
        manager: manager?.data?.full_name ?? null,
      },
      leave_requests: leave.data ?? [],
      documents: docs.data ?? [],
      performance_reviews: reviews.data ?? [],
      disciplinary_cases: cases.data ?? [],
    };

    const prompt = `Today is ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.\n\nProduce the profile summary for this employee.\n\n<employee_data>\n${JSON.stringify(data, null, 2)}\n</employee_data>`;

    return streamCompletionResponse({ system: SYSTEM_PROMPT, prompt, maxTokens: 1400 });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api_ai_profile_summary" } });
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
