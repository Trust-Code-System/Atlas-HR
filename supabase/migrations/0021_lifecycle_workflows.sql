-- Phase E.6: Onboarding and offboarding lifecycle workflow engines

create table if not exists public.lifecycle_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('onboarding','offboarding')),
  description text,
  applies_to_department text[],
  applies_to_employment_type text[],
  applies_to_role_pattern text,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.lifecycle_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.lifecycle_templates(id) on delete cascade,
  task_order int not null,
  title text not null,
  description text,
  task_type text not null check (task_type in (
    'document_request','document_upload','training','meeting',
    'system_access','equipment','manager_action','hr_action',
    'employee_action','custom'
  )),
  assignee_type text not null check (assignee_type in (
    'employee','manager','hr','it_team','specific_user','department_head'
  )),
  assignee_value text,
  due_offset_days int,
  is_required boolean default true,
  related_doc_type text,
  related_training_slug text,
  related_acknowledgment_type text,
  knowledge_article_slug text,
  unique(template_id, task_order)
);

create table if not exists public.lifecycle_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.lifecycle_templates(id),
  employee_id uuid not null references public.employees(id) on delete cascade,
  type text not null check (type in ('onboarding','offboarding')),
  reference_date date not null,
  status text default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.lifecycle_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.lifecycle_runs(id) on delete cascade,
  template_task_id uuid references public.lifecycle_template_tasks(id),
  title text not null,
  description text,
  task_type text not null,
  assignee_user_id uuid references public.profiles(id),
  due_at timestamptz,
  status text default 'pending' check (status in ('pending','in_progress','completed','skipped','blocked')),
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  notes text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_lifecycle_templates_org on public.lifecycle_templates(org_id, type, is_active);
create index if not exists idx_lifecycle_template_tasks_template on public.lifecycle_template_tasks(template_id, task_order);
create index if not exists idx_lifecycle_runs_employee on public.lifecycle_runs(employee_id);
create index if not exists idx_lifecycle_runs_status on public.lifecycle_runs(status, type);
create index if not exists idx_lifecycle_tasks_assignee on public.lifecycle_tasks(assignee_user_id, status, due_at);
create index if not exists idx_lifecycle_tasks_run on public.lifecycle_tasks(run_id, status);

alter table public.lifecycle_templates enable row level security;
alter table public.lifecycle_template_tasks enable row level security;
alter table public.lifecycle_runs enable row level security;
alter table public.lifecycle_tasks enable row level security;

drop policy if exists "View lifecycle templates" on public.lifecycle_templates;
create policy "View lifecycle templates" on public.lifecycle_templates
  for select using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_employees'));

drop policy if exists "Manage lifecycle templates" on public.lifecycle_templates;
create policy "Manage lifecycle templates" on public.lifecycle_templates
  for all using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_settings'))
  with check (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_settings'));

drop policy if exists "View lifecycle template tasks" on public.lifecycle_template_tasks;
create policy "View lifecycle template tasks" on public.lifecycle_template_tasks
  for select using (
    exists (
      select 1 from public.lifecycle_templates t
      where t.id = template_id
        and (public.has_permission(t.org_id, 'all_hr') or public.has_permission(t.org_id, 'manage_employees'))
    )
  );

drop policy if exists "Manage lifecycle template tasks" on public.lifecycle_template_tasks;
create policy "Manage lifecycle template tasks" on public.lifecycle_template_tasks
  for all using (
    exists (
      select 1 from public.lifecycle_templates t
      where t.id = template_id
        and (public.has_permission(t.org_id, 'all_hr') or public.has_permission(t.org_id, 'manage_settings'))
    )
  )
  with check (
    exists (
      select 1 from public.lifecycle_templates t
      where t.id = template_id
        and (public.has_permission(t.org_id, 'all_hr') or public.has_permission(t.org_id, 'manage_settings'))
    )
  );

drop policy if exists "View lifecycle runs" on public.lifecycle_runs;
create policy "View lifecycle runs" on public.lifecycle_runs
  for select using (
    exists (
      select 1
      from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_employees')
          or e.linked_user_id = auth.uid()
          or (public.has_permission(e.org_id, 'view_team') and public.manages_employee(e.id))
        )
    )
  );

drop policy if exists "Manage lifecycle runs" on public.lifecycle_runs;
create policy "Manage lifecycle runs" on public.lifecycle_runs
  for all using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and (public.has_permission(e.org_id, 'all_hr') or public.has_permission(e.org_id, 'manage_employees'))
    )
  )
  with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and (public.has_permission(e.org_id, 'all_hr') or public.has_permission(e.org_id, 'manage_employees'))
    )
  );

drop policy if exists "View lifecycle tasks" on public.lifecycle_tasks;
create policy "View lifecycle tasks" on public.lifecycle_tasks
  for select using (
    assignee_user_id = auth.uid()
    or exists (
      select 1
      from public.lifecycle_runs r
      join public.employees e on e.id = r.employee_id
      where r.id = run_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_employees')
          or e.linked_user_id = auth.uid()
          or (public.has_permission(e.org_id, 'view_team') and public.manages_employee(e.id))
        )
    )
  );

drop policy if exists "Update assigned lifecycle tasks" on public.lifecycle_tasks;
create policy "Update assigned lifecycle tasks" on public.lifecycle_tasks
  for update using (assignee_user_id = auth.uid())
  with check (assignee_user_id = auth.uid());

drop policy if exists "HR manages lifecycle tasks" on public.lifecycle_tasks;
create policy "HR manages lifecycle tasks" on public.lifecycle_tasks
  for all using (
    exists (
      select 1
      from public.lifecycle_runs r
      join public.employees e on e.id = r.employee_id
      where r.id = run_id and (public.has_permission(e.org_id, 'all_hr') or public.has_permission(e.org_id, 'manage_employees'))
    )
  )
  with check (
    exists (
      select 1
      from public.lifecycle_runs r
      join public.employees e on e.id = r.employee_id
      where r.id = run_id and (public.has_permission(e.org_id, 'all_hr') or public.has_permission(e.org_id, 'manage_employees'))
    )
  );

create or replace function public.seed_default_lifecycle_templates(_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  onboarding_id uuid;
  offboarding_id uuid;
begin
  if not exists (select 1 from public.lifecycle_templates where org_id = _org_id and type = 'onboarding') then
    insert into public.lifecycle_templates (org_id, name, type, description, is_default)
    values (_org_id, 'Onboarding - Standard', 'onboarding', 'Day -7 through Day 90 onboarding workflow.', true)
    returning id into onboarding_id;

    insert into public.lifecycle_template_tasks
      (template_id, task_order, title, description, task_type, assignee_type, due_offset_days, related_doc_type, related_acknowledgment_type, knowledge_article_slug)
    values
      (onboarding_id, 1, 'Send welcome packet', 'Share start date, agenda, contacts, and first-week expectations.', 'hr_action', 'hr', -7, null, null, 'onboarding-starts-before-day-one-pre-boarding'),
      (onboarding_id, 2, 'Prepare equipment list', 'Confirm laptop, access needs, and remote setup requirements.', 'equipment', 'hr', -7, null, null, 'onboarding-remote-employees-whats-different'),
      (onboarding_id, 3, 'Send personal welcome message', 'Manager sends a short welcome note before day one.', 'manager_action', 'manager', -5, null, null, 'buddy-systems-and-mentorship-in-onboarding'),
      (onboarding_id, 4, 'Confirm start date and time', 'Confirm arrival details and first-day schedule.', 'hr_action', 'hr', -3, null, null, 'onboarding-starts-before-day-one-pre-boarding'),
      (onboarding_id, 5, 'Complete pre-boarding paperwork', 'Complete employee information and required forms.', 'employee_action', 'employee', -1, 'employee_information', null, 'the-30-60-90-day-onboarding-plan-that-works'),
      (onboarding_id, 6, 'Welcome orientation', 'Run office tour or virtual welcome.', 'meeting', 'hr', 0, null, null, 'the-30-60-90-day-onboarding-plan-that-works'),
      (onboarding_id, 7, 'Provision system access', 'Confirm account access and basic security setup.', 'system_access', 'hr', 0, null, null, 'onboarding-remote-employees-whats-different'),
      (onboarding_id, 8, 'Sign employment contract', 'Upload or acknowledge signed employment agreement.', 'document_upload', 'employee', 0, 'employment_contract', null, 'building-your-first-employee-handbook'),
      (onboarding_id, 9, 'Set up payroll information', 'Provide bank, tax, and payroll details.', 'document_request', 'employee', 0, 'payroll_details', null, 'international-payroll-getting-started-with-global-teams'),
      (onboarding_id, 10, 'Welcome 1:1', 'Manager holds first-day check-in and confirms support plan.', 'meeting', 'manager', 0, null, null, 'the-30-60-90-day-plan'),
      (onboarding_id, 11, 'Acknowledge handbook', 'Read and acknowledge the current employee handbook.', 'employee_action', 'employee', 1, null, 'handbook', 'building-your-first-employee-handbook'),
      (onboarding_id, 12, 'Acknowledge code of conduct', 'Read and acknowledge code of conduct.', 'employee_action', 'employee', 1, null, 'code_of_conduct', 'code-of-conduct-making-values-actionable'),
      (onboarding_id, 13, 'Complete role-specific training', 'Complete first-week role and compliance training.', 'training', 'employee', 3, null, null, 'the-30-60-90-day-onboarding-plan-that-works'),
      (onboarding_id, 14, 'End-of-week check-in', 'Manager checks role clarity, blockers, and support needs.', 'meeting', 'manager', 5, null, null, 'the-30-60-90-day-plan'),
      (onboarding_id, 15, '30-day check-in', 'Review progress, onboarding experience, and early goals.', 'meeting', 'manager', 30, null, null, 'the-30-60-90-day-plan'),
      (onboarding_id, 16, '60-day check-in', 'Review contribution, support, and next priorities.', 'meeting', 'manager', 60, null, null, 'the-30-60-90-day-plan'),
      (onboarding_id, 17, 'Probation review', 'Manager submits probation recommendation to HR.', 'manager_action', 'manager', 90, null, null, 'probation-periods-legal-and-practical'),
      (onboarding_id, 18, 'Probation decision', 'HR records pass, extend, or fail decision.', 'hr_action', 'hr', 90, null, null, 'probation-periods-legal-and-practical');
  end if;

  if not exists (select 1 from public.lifecycle_templates where org_id = _org_id and type = 'offboarding') then
    insert into public.lifecycle_templates (org_id, name, type, description, is_default)
    values (_org_id, 'Offboarding - Standard', 'offboarding', 'Notice through final settlement offboarding workflow.', true)
    returning id into offboarding_id;

    insert into public.lifecycle_template_tasks
      (template_id, task_order, title, description, task_type, assignee_type, due_offset_days, related_doc_type, knowledge_article_slug)
    values
      (offboarding_id, 1, 'Schedule exit interview', 'Invite employee and prepare exit interview guide.', 'hr_action', 'hr', -14, null, 'the-exit-interview-getting-truth-and-using-it'),
      (offboarding_id, 2, 'Notify payroll of termination', 'Confirm final pay, deductions, and settlement timeline.', 'hr_action', 'hr', -14, null, 'final-settlement-statement'),
      (offboarding_id, 3, 'Initiate knowledge transfer plan', 'Manager documents handover owners and key deadlines.', 'manager_action', 'manager', -14, null, 'the-exit-interview-getting-truth-and-using-it'),
      (offboarding_id, 4, 'Document handovers', 'Employee completes handover notes and shared folder transfer.', 'employee_action', 'employee', -7, null, 'documentation-the-hr-habit-that-protects-everyone'),
      (offboarding_id, 5, 'Confirm knowledge transfer complete', 'Manager confirms critical handovers are done.', 'manager_action', 'manager', -7, null, 'documentation-the-hr-habit-that-protects-everyone'),
      (offboarding_id, 6, 'Prepare reference letter draft', 'Prepare draft if company policy allows references.', 'hr_action', 'hr', -7, 'reference_letter', 'reference-checks-what-to-ask-what-to-avoid'),
      (offboarding_id, 7, 'Submit final timesheets and expenses', 'Employee submits final outstanding items.', 'employee_action', 'employee', -1, null, 'travel-and-expense-policy-clarity-prevents-conflict'),
      (offboarding_id, 8, 'Return equipment', 'Confirm company assets are returned or shipped.', 'equipment', 'employee', -1, null, 'documentation-the-hr-habit-that-protects-everyone'),
      (offboarding_id, 9, 'Conduct exit interview', 'Capture exit themes and follow-up actions.', 'meeting', 'hr', 0, null, 'the-exit-interview-getting-truth-and-using-it'),
      (offboarding_id, 10, 'Revoke system access', 'Confirm access revocation on last day.', 'system_access', 'hr', 0, null, 'data-privacy-and-hr-gdpr-ccpa-and-beyond'),
      (offboarding_id, 11, 'Issue final paycheck', 'Confirm final pay and statutory documents.', 'hr_action', 'hr', 0, 'final_paycheck', 'final-settlement-statement'),
      (offboarding_id, 12, 'Update org chart', 'Remove or mark employee as alumni in people records.', 'hr_action', 'hr', 0, null, 'documentation-the-hr-habit-that-protects-everyone'),
      (offboarding_id, 13, 'Process final settlement', 'Close out settlement, leave balance, and final documents.', 'hr_action', 'hr', 7, 'final_settlement', 'final-settlement-statement'),
      (offboarding_id, 14, 'Send reference letter if approved', 'Send approved reference letter.', 'hr_action', 'hr', 7, 'reference_letter', 'reference-checks-what-to-ask-what-to-avoid');
  end if;
end $$;

create or replace function public.seed_lifecycle_templates_on_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_default_lifecycle_templates(new.id);
  return new;
end $$;

drop trigger if exists trg_seed_lifecycle_templates on public.organisations;
create trigger trg_seed_lifecycle_templates
  after insert on public.organisations
  for each row execute function public.seed_lifecycle_templates_on_org();

select public.seed_default_lifecycle_templates(id) from public.organisations;
