import { createElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { WorkflowEscalation } from "@/emails/org/WorkflowEscalation";

type PendingDecision = {
  id: string;
  request_id: string;
  step_id: string;
  step_order: number;
  created_at: string;
};

type ApprovalRequest = {
  id: string;
  org_id: string;
  trigger_type: string;
  status: string;
};

type WorkflowStep = {
  id: string;
  sla_hours: number;
  escalation_after_hours: number | null;
};

type OrgMember = {
  user_id: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-cron-secret");

  if (!cronSecret) {
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}` && secretHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.atlashr.com";

  // Find all undecided approval decisions on pending requests
  const { data: pendingDecisions, error: decisionsError } = await admin
    .from("approval_decisions")
    .select("id, request_id, step_id, step_order, created_at")
    .is("decided_at", null)
    .is("decision", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (decisionsError) {
    return NextResponse.json({ error: decisionsError.message }, { status: 500 });
  }

  const escalations: { requestId: string; ageHours: string; targetCount: number }[] = [];

  for (const decision of (pendingDecisions ?? []) as PendingDecision[]) {
    // Check the parent request is still pending
    const { data: request } = await admin
      .from("approval_requests")
      .select("id, org_id, trigger_type, status")
      .eq("id", decision.request_id)
      .eq("status", "pending")
      .maybeSingle();

    if (!request) continue;
    const ar = request as ApprovalRequest;

    // Check the step has an escalation threshold configured
    const { data: step } = await admin
      .from("approval_workflow_steps")
      .select("id, sla_hours, escalation_after_hours")
      .eq("id", decision.step_id)
      .maybeSingle();

    if (!step) continue;
    const ws = step as WorkflowStep;
    if (!ws.escalation_after_hours) continue;

    // Check if enough time has passed
    const ageMs = Date.now() - new Date(decision.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < ws.escalation_after_hours) continue;

    // Check if this step was already escalated
    const { count: alreadyEscalated } = await admin
      .from("approval_decisions")
      .select("id", { count: "exact", head: true })
      .eq("request_id", decision.request_id)
      .eq("step_id", decision.step_id)
      .eq("decision", "escalated");

    if ((alreadyEscalated ?? 0) > 0) continue;

    // Record the escalation decision
    await admin.from("approval_decisions").insert({
      request_id: decision.request_id,
      step_id: decision.step_id,
      step_order: decision.step_order,
      decided_by: null,
      decision: "escalated",
      comment: `Auto-escalated after ${ageHours.toFixed(1)} hours (escalation threshold: ${ws.escalation_after_hours}h, SLA: ${ws.sla_hours}h)`,
      decided_at: new Date().toISOString(),
    });

    // Log to activity_log
    await admin.from("activity_log").insert({
      org_id: ar.org_id,
      actor_user_id: null,
      actor_display_name: "System",
      resource_type: "approval_request",
      resource_id: ar.id,
      action: "escalated",
      reason: `SLA exceeded — pending for ${ageHours.toFixed(1)} hours`,
      source: "system",
    });

    // Notify all HR admins in the org
    const { data: members } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", ar.org_id)
      .contains("roles", ["hr_admin"]);

    const hrAdminIds = ((members ?? []) as OrgMember[]).map((m) => m.user_id);
    if (hrAdminIds.length === 0) {
      escalations.push({ requestId: ar.id, ageHours: ageHours.toFixed(1), targetCount: 0 });
      continue;
    }

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", hrAdminIds);

    let targetCount = 0;
    for (const profile of (profiles ?? []) as Profile[]) {
      if (!profile.email) continue;

      const recipientUnsub = unsubscribeUrl(profile.id, "workflow_escalation");

      await Promise.allSettled([
        // In-app notification
        admin.from("notifications").insert({
          user_id: profile.id,
          type: "workflow_escalation",
          title: "Approval escalated to you",
          body: `An approval for ${ar.trigger_type.replace(/_/g, " ")} has been waiting ${ageHours.toFixed(0)} hours and needs your attention.`,
          link: `/workspace/approvals/${ar.id}`,
        }),
        // Email notification
        sendEmail({
          to: profile.email,
          userId: profile.id,
          type: "workflow_escalation",
          subject: `Approval escalated: ${ar.trigger_type.replace(/_/g, " ")}`,
          react: createElement(WorkflowEscalation, {
            recipientName: profile.full_name ?? profile.email,
            triggerType: ar.trigger_type,
            requestId: ar.id,
            ageHours: ageHours.toFixed(0),
            appUrl,
            unsubscribeUrl: recipientUnsub,
          }),
          unsubscribeUrl: recipientUnsub,
        }),
      ]);

      targetCount++;
    }

    escalations.push({ requestId: ar.id, ageHours: ageHours.toFixed(1), targetCount });
  }

  return NextResponse.json({ ok: true, processed: escalations.length, escalations });
}
