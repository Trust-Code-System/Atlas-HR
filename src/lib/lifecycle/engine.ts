import { createAdminClient } from "@/lib/supabase/admin";

type LifecycleType = "onboarding" | "offboarding";

type EmployeeRow = {
  id: string;
  org_id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  manager_id: string | null;
  linked_user_id: string | null;
  start_date: string | null;
  end_date: string | null;
};

type LifecycleTemplate = {
  id: string;
  org_id: string;
  type: LifecycleType;
  applies_to_department: string[] | null;
  applies_to_employment_type: string[] | null;
  applies_to_role_pattern: string | null;
  is_default: boolean | null;
};

type TemplateTask = {
  id: string;
  task_order: number;
  title: string;
  description: string | null;
  task_type: string;
  assignee_type: string;
  assignee_value: string | null;
  due_offset_days: number | null;
  related_doc_type: string | null;
  related_training_slug: string | null;
  related_acknowledgment_type: string | null;
  knowledge_article_slug: string | null;
};

export async function startLifecycleRun(input: {
  employeeId: string;
  type: LifecycleType;
  referenceDate?: string | null;
}) {
  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("employees")
    .select("*")
    .eq("id", input.employeeId)
    .maybeSingle();

  if (!employee) return { ok: false as const, error: "Employee not found" };
  const employeeRow = employee as EmployeeRow;
  const referenceDate =
    input.referenceDate ??
    (input.type === "onboarding" ? employeeRow.start_date : employeeRow.end_date);

  if (!referenceDate) return { ok: false as const, error: "Reference date is required" };

  const { data: existing } = await admin
    .from("lifecycle_runs")
    .select("id")
    .eq("employee_id", employeeRow.id)
    .eq("type", input.type)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existing) return { ok: true as const, runId: existing.id, existing: true };

  const template = await findTemplate(employeeRow, input.type);
  if (!template) return { ok: false as const, error: "No lifecycle template found" };

  const { data: run, error } = await admin
    .from("lifecycle_runs")
    .insert({
      template_id: template.id,
      employee_id: employeeRow.id,
      type: input.type,
      reference_date: referenceDate,
    })
    .select("id")
    .single();

  if (error || !run) return { ok: false as const, error: error?.message ?? "Failed to create lifecycle run" };

  const { data: templateTasks } = await admin
    .from("lifecycle_template_tasks")
    .select("*")
    .eq("template_id", template.id)
    .order("task_order", { ascending: true });

  for (const templateTask of (templateTasks ?? []) as TemplateTask[]) {
    let assignee = await resolveAssignee(employeeRow, templateTask.assignee_type, templateTask.assignee_value);

    // Fall back to any HR admin so the task is never silently dropped
    if (!assignee) {
      const { data: hrAdmin } = await admin
        .from("org_members")
        .select("user_id")
        .eq("org_id", employeeRow.org_id)
        .contains("roles", ["hr_admin"])
        .limit(1)
        .maybeSingle();
      assignee = hrAdmin?.user_id ?? null;
    }

    const dueAt = dueDate(referenceDate, templateTask.due_offset_days);
    const { data: task } = await admin
      .from("lifecycle_tasks")
      .insert({
        run_id: run.id,
        template_task_id: templateTask.id,
        title: templateTask.title,
        description: templateTask.description,
        task_type: templateTask.task_type,
        assignee_user_id: assignee,
        due_at: dueAt,
      })
      .select("id")
      .single();

    if (assignee && task) {
      await admin.from("employee_tasks").insert({
        org_id: employeeRow.org_id,
        employee_id: employeeRow.id,
        assigned_to: assignee,
        title: templateTask.title,
        description: templateTask.description,
        task_type: input.type === "onboarding" ? "onboarding" : "offboarding",
        related_resource_type: "lifecycle_task",
        related_resource_id: task.id,
        due_at: dueAt,
        status: "pending",
      });

      try {
        await admin.from("notifications").insert({
          user_id: assignee,
          type: "lifecycle_task",
          title: `${input.type === "onboarding" ? "Onboarding" : "Offboarding"} task assigned`,
          body: `${templateTask.title} for ${employeeRow.full_name}`,
          link: assignee === employeeRow.linked_user_id ? "/employee/tasks" : "/workspace/lifecycle",
        });
      } catch (err) {
        console.error("lifecycle notification failed (non-fatal):", err);
      }
    }
  }

  return { ok: true as const, runId: run.id, existing: false };
}

export async function syncLifecycleTaskCompletion(input: {
  lifecycleTaskId: string;
  completedBy: string;
}) {
  const admin = createAdminClient();
  await admin
    .from("lifecycle_tasks")
    .update({
      status: "completed",
      completed_by: input.completedBy,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.lifecycleTaskId);
}

async function findTemplate(employee: EmployeeRow, type: LifecycleType) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("lifecycle_templates")
    .select("*")
    .eq("org_id", employee.org_id)
    .eq("type", type)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return ((data ?? []) as LifecycleTemplate[]).find((template) => templateMatches(employee, template)) ?? null;
}

function templateMatches(employee: EmployeeRow, template: LifecycleTemplate) {
  if (template.applies_to_department?.length && !template.applies_to_department.includes(employee.department ?? "")) {
    return false;
  }
  if (
    template.applies_to_employment_type?.length &&
    !template.applies_to_employment_type.includes(employee.employment_type ?? "")
  ) {
    return false;
  }
  if (template.applies_to_role_pattern) {
    try {
      return new RegExp(template.applies_to_role_pattern, "i").test(employee.job_title ?? "");
    } catch {
      return true;
    }
  }
  return true;
}

async function resolveAssignee(employee: EmployeeRow, assigneeType: string, assigneeValue: string | null) {
  if (assigneeType === "employee") return employee.linked_user_id;
  if (assigneeType === "specific_user") return assigneeValue;

  const admin = createAdminClient();

  if (assigneeType === "manager" && employee.manager_id) {
    const { data: manager } = await admin
      .from("employees")
      .select("linked_user_id")
      .eq("id", employee.manager_id)
      .maybeSingle();
    return manager?.linked_user_id ?? null;
  }

  if (assigneeType === "department_head" && employee.department) {
    const { data: head } = await admin
      .from("employees")
      .select("linked_user_id")
      .eq("org_id", employee.org_id)
      .eq("department", employee.department)
      .eq("is_department_head", true)
      .not("linked_user_id", "is", null)
      .limit(1)
      .maybeSingle();
    return head?.linked_user_id ?? null;
  }

  if (assigneeType === "hr" || assigneeType === "it_team") {
    const { data } = await admin
      .from("org_members")
      .select("user_id, roles")
      .eq("org_id", employee.org_id)
      .contains("roles", ["hr_admin"])
      .limit(1)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  return null;
}

function dueDate(referenceDate: string, offset: number | null) {
  const date = new Date(`${referenceDate}T09:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + (offset ?? 0));
  return date.toISOString();
}
