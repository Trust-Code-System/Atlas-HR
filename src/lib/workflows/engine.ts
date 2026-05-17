import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { Json } from "@/types/database";

export type TriggerType =
  | "leave_request"
  | "document_upload"
  | "profile_change"
  | "expense_claim"
  | "time_off_request"
  | "role_change"
  | "salary_change"
  | "employment_change"
  | "custom";

export type SubjectType =
  | "leave_request"
  | "employee"
  | "document"
  | "profile_change"
  | "expense_claim"
  | "custom";

type Workflow = {
  id: string;
  org_id: string;
  trigger_type: string;
  applies_when: Json | null;
};

type WorkflowStep = {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  approver_type: string;
  approver_value: string | null;
  is_optional: boolean | null;
  sla_hours: number | null;
};

type ApprovalRequest = {
  id: string;
  workflow_id: string;
  org_id: string;
  trigger_type: string;
  subject_type: string;
  subject_id: string;
  initiated_by: string;
  current_step: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  payload: Json | null;
};

type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

export async function initiateApproval(input: {
  orgId: string;
  triggerType: TriggerType;
  subjectType: SubjectType;
  subjectId: string;
  payload?: Record<string, unknown>;
  initiatedBy: string;
}) {
  const admin = createAdminClient();
  const { data: workflows } = await admin
    .from("approval_workflows")
    .select("*")
    .eq("org_id", input.orgId)
    .eq("trigger_type", input.triggerType)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const workflow = ((workflows ?? []) as Workflow[]).find((candidate) =>
    appliesWhenMatches(candidate.applies_when, input.payload ?? {})
  );

  if (!workflow) {
    await applyPostApprovalAction({
      id: crypto.randomUUID(),
      workflow_id: "",
      org_id: input.orgId,
      trigger_type: input.triggerType,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      initiated_by: input.initiatedBy,
      current_step: 0,
      status: "approved",
      payload: (input.payload ?? {}) as Json,
    });
    return { ok: true as const, requestId: null, autoApproved: true };
  }

  const { data: steps } = await admin
    .from("approval_workflow_steps")
    .select("*")
    .eq("workflow_id", workflow.id)
    .order("step_order", { ascending: true });

  const firstStep = ((steps ?? []) as WorkflowStep[])[0];
  if (!firstStep) {
    await applyPostApprovalAction({
      id: crypto.randomUUID(),
      workflow_id: workflow.id,
      org_id: input.orgId,
      trigger_type: input.triggerType,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      initiated_by: input.initiatedBy,
      current_step: 0,
      status: "approved",
      payload: (input.payload ?? {}) as Json,
    });
    return { ok: true as const, requestId: null, autoApproved: true };
  }

  const { data: request, error } = await admin
    .from("approval_requests")
    .insert({
      workflow_id: workflow.id,
      org_id: input.orgId,
      trigger_type: input.triggerType,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      initiated_by: input.initiatedBy,
      current_step: firstStep.step_order,
      payload: (input.payload ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !request) return { ok: false as const, error: error?.message ?? "Approval request failed" };

  await createStepDecisions({
    request: request as ApprovalRequest,
    step: firstStep,
    payload: input.payload ?? {},
  });

  return { ok: true as const, requestId: request.id, autoApproved: false };
}

export async function decide(input: {
  requestId: string;
  deciderUserId: string;
  decision: "approved" | "rejected";
  comment?: string;
}) {
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") {
    return { ok: false as const, error: "Approval request is not pending" };
  }

  const currentStep = request.current_step ?? 1;
  const { data: pendingDecision } = await admin
    .from("approval_decisions")
    .select("*")
    .eq("request_id", input.requestId)
    .eq("step_order", currentStep)
    .eq("approver_user_id", input.deciderUserId)
    .is("decision", null)
    .maybeSingle();

  if (!pendingDecision) return { ok: false as const, error: "You are not the current approver" };

  await admin
    .from("approval_decisions")
    .update({
      decision: input.decision,
      decided_by: input.deciderUserId,
      comment: input.comment ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", pendingDecision.id);

  if (input.decision === "rejected") {
    await admin
      .from("approval_requests")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", input.requestId);
    await notifyUser(request.initiated_by, "Approval rejected", "Your request was rejected.", approvalLink(request));
    return { ok: true as const, status: "rejected" as const };
  }

  const { data: remainingAtStep } = await admin
    .from("approval_decisions")
    .select("id")
    .eq("request_id", input.requestId)
    .eq("step_order", currentStep)
    .is("decision", null)
    .limit(1);

  if ((remainingAtStep ?? []).length > 0) {
    return { ok: true as const, status: "pending" as const };
  }

  const { data: nextStep } = await admin
    .from("approval_workflow_steps")
    .select("*")
    .eq("workflow_id", request.workflow_id)
    .gt("step_order", currentStep)
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextStep) {
    await admin
      .from("approval_requests")
      .update({ status: "approved", decided_at: new Date().toISOString() })
      .eq("id", input.requestId);
    await applyPostApprovalAction(request as ApprovalRequest);
    await notifyUser(request.initiated_by, "Approval complete", "Your request was approved.", approvalLink(request));
    return { ok: true as const, status: "approved" as const };
  }

  await admin
    .from("approval_requests")
    .update({ current_step: nextStep.step_order })
    .eq("id", input.requestId);

  await createStepDecisions({
    request: request as ApprovalRequest,
    step: nextStep as WorkflowStep,
    payload: payloadObject(request.payload),
  });

  return { ok: true as const, status: "pending" as const };
}

export async function applyPostApprovalAction(request: ApprovalRequest) {
  const admin = createAdminClient();
  const payload = payloadObject(request.payload);

  if (request.trigger_type === "leave_request") {
    await admin
      .from("leave_requests")
      .update({
        status: "approved",
        approver_id: (payload.approved_by as string | undefined) ?? request.initiated_by,
        approved_at: new Date().toISOString(),
      })
      .eq("id", request.subject_id);
    return;
  }

  if (request.trigger_type === "profile_change") {
    const changeSet = payloadObject(payload.change_set as Json | null);
    const employeeUpdate = editableEmployeeUpdate(changeSet);
    if (Object.keys(employeeUpdate).length > 0) {
      await admin.from("employees").update(employeeUpdate).eq("id", request.subject_id);
    }
    await admin
      .from("employee_profile_change_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", payload.change_request_id as string);
    return;
  }

  if (request.trigger_type === "document_upload") {
    await admin
      .from("employee_document_status")
      .update({ status: "approved", last_checked_at: new Date().toISOString() })
      .eq("current_document_id", request.subject_id);
  }
}

async function createStepDecisions(input: {
  request: ApprovalRequest;
  step: WorkflowStep;
  payload: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const approvers = await resolveApprovers({
    orgId: input.request.org_id,
    subjectType: input.request.subject_type,
    subjectId: input.request.subject_id,
    approverType: input.step.approver_type,
    approverValue: input.step.approver_value,
    payload: input.payload,
  });

  if (approvers.length === 0 && input.step.is_optional) return;

  const fallbackApprovers = approvers.length > 0 ? approvers : await usersWithRole(input.request.org_id, "hr_admin");
  await admin.from("approval_decisions").insert(
    fallbackApprovers.map((userId) => ({
      request_id: input.request.id,
      step_id: input.step.id,
      step_order: input.step.step_order,
      approver_user_id: userId,
    }))
  );

  await Promise.all(
    fallbackApprovers.map((userId) =>
      notifyUser(userId, "Approval needed", approvalNotificationBody(input.request), approvalLink(input.request))
    )
  );
}

async function resolveApprovers(input: {
  orgId: string;
  subjectType: string;
  subjectId: string;
  approverType: string;
  approverValue: string | null;
  payload: Record<string, unknown>;
}) {
  if (input.approverType === "specific_user" && input.approverValue) return [input.approverValue];
  if (input.approverType === "specific_role" && input.approverValue) {
    return usersWithRole(input.orgId, input.approverValue);
  }
  if (input.approverType === "hr_admin") return usersWithRole(input.orgId, "hr_admin");
  if (input.approverType === "manager_of_subject") return managerApprover(input.subjectType, input.subjectId, input.payload, 1);
  if (input.approverType === "manager_n_levels_up") {
    return managerApprover(input.subjectType, input.subjectId, input.payload, Number(input.approverValue ?? 1));
  }
  if (input.approverType === "department_head") return departmentHeadApprover(input.orgId, input.payload);
  return [];
}

async function usersWithRole(orgId: string, role: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("org_members")
    .select("user_id, roles")
    .eq("org_id", orgId)
    .contains("roles", [role]);
  return [...new Set((data ?? []).map((member) => member.user_id))];
}

async function managerApprover(subjectType: string, subjectId: string, payload: Record<string, unknown>, levels: number) {
  const admin = createAdminClient();
  let employeeId = (payload.employee_id as string | undefined) ?? (subjectType === "employee" ? subjectId : undefined);

  if (!employeeId && subjectType === "leave_request") {
    const { data } = await admin.from("leave_requests").select("employee_id").eq("id", subjectId).maybeSingle();
    employeeId = data?.employee_id;
  }
  if (!employeeId && subjectType === "document") {
    const { data } = await admin.from("employee_documents").select("employee_id").eq("id", subjectId).maybeSingle();
    employeeId = data?.employee_id;
  }
  if (!employeeId) return [];

  let currentId: string = employeeId;
  let managerUserId: string | null = null;

  for (let i = 0; i < Math.max(1, levels); i += 1) {
    const { data: employee }: { data: { manager_id: string | null } | null } = await admin
      .from("employees")
      .select("manager_id")
      .eq("id", currentId)
      .maybeSingle();
    if (!employee?.manager_id) return [];

    const { data: manager }: { data: { id: string; linked_user_id: string | null } | null } = await admin
      .from("employees")
      .select("id, linked_user_id")
      .eq("id", employee.manager_id)
      .maybeSingle();
    if (!manager) return [];
    currentId = manager.id;
    managerUserId = manager.linked_user_id;
  }

  return managerUserId ? [managerUserId] : [];
}

async function departmentHeadApprover(orgId: string, payload: Record<string, unknown>) {
  const admin = createAdminClient();
  const department = payload.department as string | undefined;
  if (!department) return [];
  const { data } = await admin
    .from("employees")
    .select("linked_user_id")
    .eq("org_id", orgId)
    .eq("department", department)
    .eq("is_department_head", true);
  return [...new Set((data ?? []).map((employee) => employee.linked_user_id).filter(Boolean))] as string[];
}

async function notifyUser(userId: string, title: string, body: string, link: string) {
  const admin = createAdminClient();
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      type: "approval",
      title,
      body,
      link,
    });
  } catch (err) {
    console.error("notifyUser failed (non-fatal):", err);
  }
}

function appliesWhenMatches(appliesWhen: Json | null, payload: Record<string, unknown>) {
  const rules = payloadObject(appliesWhen);
  return Object.entries(rules).every(([key, value]) => payload[key] === value);
}

function payloadObject(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function editableEmployeeUpdate(changeSet: Record<string, unknown>): EmployeeUpdate {
  const allowed = ["phone", "address", "emergency_contact_name", "emergency_contact_phone", "photo_url"] as const;
  const update: EmployeeUpdate = {};
  for (const key of allowed) {
    const value = changeSet[key];
    if (typeof value === "string" || value === null) update[key] = value;
  }
  return update;
}

function approvalLink(request: Pick<ApprovalRequest, "id">) {
  return `/workspace/approvals?request=${request.id}`;
}

function approvalNotificationBody(request: ApprovalRequest) {
  return `${request.trigger_type.replaceAll("_", " ")} request needs your review.`;
}
