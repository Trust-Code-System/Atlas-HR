-- Unplanned: generic workflow bundle runs for Atlas HR workflow library.

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  workflow_slug text not null,
  title text not null,
  summary text,
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  country text,
  employee_id uuid references public.employees(id) on delete set null,
  launch_context jsonb not null default '{}'::jsonb,
  next_step_url text,
  created_by uuid references public.profiles(id),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_runs_org_status
  on public.workflow_runs(org_id, status, created_at desc);
create index if not exists idx_workflow_runs_slug
  on public.workflow_runs(org_id, workflow_slug, created_at desc);
create index if not exists idx_workflow_runs_employee
  on public.workflow_runs(employee_id, status, created_at desc)
  where employee_id is not null;

alter table public.workflow_runs enable row level security;

drop policy if exists "View workflow runs in workspace" on public.workflow_runs;
create policy "View workflow runs in workspace"
  on public.workflow_runs for select
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'manage_settings')
    or created_by = auth.uid()
  );

drop policy if exists "Create workflow runs in workspace" on public.workflow_runs;
create policy "Create workflow runs in workspace"
  on public.workflow_runs for insert
  with check (
    created_by = auth.uid()
    and (
      public.has_permission(org_id, 'all_hr')
      or public.has_permission(org_id, 'manage_employees')
      or public.has_permission(org_id, 'manage_settings')
    )
  );

drop policy if exists "Manage workflow runs in workspace" on public.workflow_runs;
create policy "Manage workflow runs in workspace"
  on public.workflow_runs for update
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'manage_settings')
    or created_by = auth.uid()
  )
  with check (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'manage_settings')
    or created_by = auth.uid()
  );
