import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { streamChatText, aiProviderStatus } from "@/lib/ai/provider";

export async function POST(req: NextRequest) {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { applicationId } = await req.json();
  if (!applicationId) return NextResponse.json({ error: "applicationId required." }, { status: 400 });

  const supabase = await createClient();

  // Fetch the application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app } = await (supabase as any)
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // Verify it belongs to this org's job
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", app.job_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return NextResponse.json({ error: "Not found in your organisation." }, { status: 404 });

  const prompt = `You are an expert HR recruiter. Analyse whether this candidate is a good fit for the open role.

## The Role
Title: ${job.title}
Department: ${job.department ?? "Not specified"}
Employment type: ${job.employment_type ?? "Not specified"}
${job.description ? `Description: ${job.description}` : ""}
${job.requirements ? `Requirements: ${job.requirements}` : ""}

## The Candidate
Name: ${app.candidate_name}
Email: ${app.candidate_email ?? "Not provided"}
Source: ${app.source ?? "Not specified"}
Current stage: ${app.stage ?? "Applied"}
${app.linkedin_url ? `LinkedIn profile: ${app.linkedin_url}` : "LinkedIn: Not provided"}
${app.notes ? `Recruiter notes: ${app.notes}` : "No notes yet."}

## Your Task
Based on the information above, provide a structured fit assessment. Be concise and practical.

Return your response in this exact format:

**Overall fit:** [Strong / Good / Moderate / Weak] match

**Strengths for this role:**
- [point 1]
- [point 2]
- [point 3 if applicable]

**Potential concerns:**
- [concern 1]
- [concern 2 if applicable]

**Recommended next step:** [one clear action, e.g. "Schedule a technical screen", "Request portfolio", "Pass — insufficient experience"]

**LinkedIn review:** ${app.linkedin_url ? `Visit ${app.linkedin_url} to verify the candidate's experience and skills listed above.` : "No LinkedIn profile provided. Consider requesting one before proceeding."}`;

  if (!aiProviderStatus().anthropic && !aiProviderStatus().openai) {
    return NextResponse.json({ error: "AI not configured." }, { status: 500 });
  }

  let text = "";
  try {
    for await (const chunk of streamChatText({
      system: "You are an expert HR recruiter providing concise, practical candidate fit assessments.",
      anthropicMessages: [{ role: "user", content: prompt }],
      openaiMessages: [{ role: "user", content: prompt }],
      maxTokens: 600,
    })) {
      text += chunk;
    }
  } catch {
    return NextResponse.json({ error: "Fit check failed." }, { status: 500 });
  }

  return NextResponse.json({ analysis: text });
}
