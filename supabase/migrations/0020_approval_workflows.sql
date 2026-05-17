-- Phase E.5: Approval workflow engine

alter table public.employees
  add column if not exists is_department_head boolean default false;

create table if not exists public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null check (trigger_type in (
    'leave_request', 'document_upload', 'profile_change',
    'expense_claim', 'time_off_request', 'role_change',
    'salary_change', 'employment_change', 'custom'
  )),
  is_active boolean default true,
  applies_when jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.approval_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.approval_workflows(id) on delete cascade,
  step_order int not null,
  name text not null,
  approver_type text not null check (approver_type in (
    'specific_user', 'specific_role', 'manager_of_subject',
    'manager_n_levels_up', 'department_head', 'hr_admin'
  )),
  approver_value text,
  is_optional boolean default false,
  sla_hours int default 48,
  escalation_after_hours int,
  unique(workflow_id, step_order)
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.approval_workflows(id),
  org_id uuid not null references public.organisations(id) on delete cascade,
  trigger_type text not null,
  subject_type text not null,
  subject_id uuid not null,
  initiated_by uuid not null references public.profiles(id),
  current_step int default 1,
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'cancelled', 'expired'
  )),
  payload jsonb,
  created_at timestamptz default now(),
  decided_at timestamptz
);

create table if not exists public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.approval_requests(id) on delete cascade,
  step_id uuid not null references public.approval_workflow_steps(id) on delete cascade,
  step_order int not null,
  approver_user_id uuid references public.profiles(id) on delete cascade,
  decided_by uuid references public.profiles(id),
  decision text check (decision in ('approved','rejected','delegated','escalated')),
  comment text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_approval_workflows_org on public.approval_workflows(org_id, trigger_type, is_active);
create index if not exists idx_approval_steps_workflow on public.approval_workflow_steps(workflow_id, step_order);
create index if not exists idx_approval_requests_org on public.approval_requests(org_id, status);
create index if not exists idx_approval_requests_pending on public.approval_requests(status) where status = 'pending';
create index if not exists idx_approval_decisions_request on public.approval_decisions(request_id);
create index if not exists idx_approval_decisions_approver on public.approval_decisions(approver_user_id, decision, created_at desc);

alter table public.approval_workflows enable row level security;
alter table public.approval_workflow_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_decisions enable row level security;

drop policy if exists "View workflows in workspace" on public.approval_workflows;
create policy "View workflows in workspace" on public.approval_workflows
  for select using (public.has_permission(org_id, 'manage_settings') or public.has_permission(org_id, 'all_hr'));

drop policy if exists "Manage workflows in workspace" on public.approval_workflows;
create policy "Manage workflows in workspace" on public.approval_workflows
  for all using (public.has_permission(org_id, 'manage_settings') or public.has_permission(org_id, 'all_hr'))
  with check (public.has_permission(org_id, 'manage_settings') or public.has_permission(org_id, 'all_hr'));

drop policy if exists "View workflow steps in workspace" on public.approval_workflow_steps;
create policy "View workflow steps in workspace" on public.approval_workflow_steps
  for select using (
    exists (
      select 1 from public.approval_workflows w
      where w.id = workflow_id
        and (public.has_permission(w.org_id, 'manage_settings') or public.has_permission(w.org_id, 'all_hr'))
    )
  );

drop policy if exists "Manage workflow steps in workspace" on public.approval_workflow_steps;
create policy "Manage workflow steps in workspace" on public.approval_workflow_steps
  for all using (
    exists (
      select 1 from public.approval_workflows w
      where w.id = workflow_id
        and (public.has_permission(w.org_id, 'manage_settings') or public.has_permission(w.org_id, 'all_hr'))
    )
  )
  with check (
    exists (
      select 1 from public.approval_workflows w
      where w.id = workflow_id
        and (public.has_permission(w.org_id, 'manage_settings') or public.has_permission(w.org_id, 'all_hr'))
    )
  );

drop policy if exists "View approval requests by role" on public.approval_requests;
create policy "View approval requests by role" on public.approval_requests
  for select using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'approve_all')
    or initiated_by = auth.uid()
    or exists (
      select 1 from public.approval_decisions d
      where d.request_id = approval_requests.id and d.approver_user_id = auth.uid()
    )
  );

drop policy if exists "Create approval requests for workspace" on public.approval_requests;
create policy "Create approval requests for workspace" on public.approval_requests
  for insert with check (
    initiated_by = auth.uid()
    and exists (
      select 1 from public.org_members om
      where om.org_id = approval_requests.org_id and om.user_id = auth.uid()
    )
  );

drop policy if exists "Update approval requests by HR" on public.approval_requests;
create policy "Update approval requests by HR" on public.approval_requests
  for update using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'approve_all'));

drop policy if exists "View approval decisions by participant" on public.approval_decisions;
create policy "View approval decisions by participant" on public.approval_decisions
  for select using (
    approver_user_id = auth.uid()
    or exists (
      select 1 from public.approval_requests r
      where r.id = request_id
        and (
          r.initiated_by = auth.uid()
          or public.has_permission(r.org_id, 'all_hr')
          or public.has_permission(r.org_id, 'approve_all')
        )
    )
  );

drop policy if exists "Approvers update own pending decisions" on public.approval_decisions;
create policy "Approvers update own pending decisions" on public.approval_decisions
  for update using (approver_user_id = auth.uid() and decision is null)
  with check (approver_user_id = auth.uid());

create or replace function public.seed_default_approval_workflows(_org_id uuid, _created_by uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  leave_workflow_id uuid;
  profile_workflow_id uuid;
  document_workflow_id uuid;
begin
  if exists (select 1 from public.approval_workflows where org_id = _org_id) then
    return;
  end if;

  insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
  values (_org_id, 'Leave Request - Standard', 'Manager approval followed by HR visibility.', 'leave_request', _created_by)
  returning id into leave_workflow_id;

  insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours, escalation_after_hours)
  values
    (leave_workflow_id, 1, 'Manager approval', 'manager_of_subject', 48, 72),
    (leave_workflow_id, 2, 'HR review', 'hr_admin', 24, null);

  insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
  values (_org_id, 'Profile Change - Standard', 'HR reviews employee self-service profile updates.', 'profile_change', _created_by)
  returning id into profile_workflow_id;

  insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours)
  values (profile_workflow_id, 1, 'HR approval', 'hr_admin', 24);

  insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
  values (_org_id, 'Document Upload - Standard', 'HR approves employee-submitted documents.', 'document_upload', _created_by)
  returning id into document_workflow_id;

  insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours, escalation_after_hours)
  values (document_workflow_id, 1, 'HR approval', 'hr_admin', 48, 120);
end $$;

create or replace function public.seed_approval_workflows_on_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_default_approval_workflows(new.id, new.created_by);
  return new;
end $$;

drop trigger if exists trg_seed_approval_workflows on public.organisations;
create trigger trg_seed_approval_workflows
  after insert on public.organisations
  for each row execute function public.seed_approval_workflows_on_org();

insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
select o.id, 'Leave Request - Standard', 'Manager approval followed by HR visibility.', 'leave_request', o.created_by
from public.organisations o
where not exists (select 1 from public.approval_workflows w where w.org_id = o.id and w.trigger_type = 'leave_request');

insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
select o.id, 'Profile Change - Standard', 'HR reviews employee self-service profile updates.', 'profile_change', o.created_by
from public.organisations o
where not exists (select 1 from public.approval_workflows w where w.org_id = o.id and w.trigger_type = 'profile_change');

insert into public.approval_workflows (org_id, name, description, trigger_type, created_by)
select o.id, 'Document Upload - Standard', 'HR approves employee-submitted documents.', 'document_upload', o.created_by
from public.organisations o
where not exists (select 1 from public.approval_workflows w where w.org_id = o.id and w.trigger_type = 'document_upload');

insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours, escalation_after_hours)
select w.id, 1, 'Manager approval', 'manager_of_subject', 48, 72
from public.approval_workflows w
where w.trigger_type = 'leave_request'
  and not exists (select 1 from public.approval_workflow_steps s where s.workflow_id = w.id and s.step_order = 1);

insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours)
select w.id, 2, 'HR review', 'hr_admin', 24
from public.approval_workflows w
where w.trigger_type = 'leave_request'
  and not exists (select 1 from public.approval_workflow_steps s where s.workflow_id = w.id and s.step_order = 2);

insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours)
select w.id, 1, 'HR approval', 'hr_admin', 24
from public.approval_workflows w
where w.trigger_type = 'profile_change'
  and not exists (select 1 from public.approval_workflow_steps s where s.workflow_id = w.id and s.step_order = 1);

insert into public.approval_workflow_steps (workflow_id, step_order, name, approver_type, sla_hours, escalation_after_hours)
select w.id, 1, 'HR approval', 'hr_admin', 48, 120
from public.approval_workflows w
where w.trigger_type = 'document_upload'
  and not exists (select 1 from public.approval_workflow_steps s where s.workflow_id = w.id and s.step_order = 1);
