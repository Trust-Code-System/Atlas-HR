-- Phase E.4: Employee self-service portal foundations

alter table public.employees
  add column if not exists linked_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists photo_url text;

update public.employees e
set linked_user_id = p.id
from public.profiles p
where lower(p.email) = lower(e.email)
  and e.linked_user_id is null;

create index if not exists idx_employees_linked_user on public.employees(linked_user_id);

create or replace function public.auto_link_employee()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.employees
  set linked_user_id = new.id
  where linked_user_id is null
    and email is not null
    and lower(email) = lower(new.email);

  insert into public.org_members (org_id, user_id, org_role, roles)
  select distinct e.org_id, new.id, 'member', array['employee']
  from public.employees e
  where e.linked_user_id = new.id
    and not exists (
      select 1
      from public.org_members om
      where om.org_id = e.org_id and om.user_id = new.id
    )
  on conflict (org_id, user_id) do nothing;

  return new;
end $$;

drop trigger if exists trg_auto_link_employee on public.profiles;
create trigger trg_auto_link_employee
  after insert on public.profiles
  for each row execute function public.auto_link_employee();

create table if not exists public.employee_profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  change_set jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default now()
);

create index if not exists idx_employee_profile_change_requests_org
  on public.employee_profile_change_requests(org_id, status, created_at desc);
create index if not exists idx_employee_profile_change_requests_employee
  on public.employee_profile_change_requests(employee_id, status, created_at desc);

create table if not exists public.employee_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  task_type text not null default 'custom' check (task_type in (
    'profile_update','document_upload','policy_acknowledgment','training',
    'onboarding','offboarding','leave','custom'
  )),
  related_resource_type text,
  related_resource_id uuid,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_employee_tasks_assigned
  on public.employee_tasks(assigned_to, status, due_at);
create index if not exists idx_employee_tasks_employee
  on public.employee_tasks(employee_id, status, due_at);

create table if not exists public.workspace_announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  title text not null,
  body text,
  published_by uuid references public.profiles(id),
  published_at timestamptz default now(),
  expires_at timestamptz,
  is_active boolean default true
);

create index if not exists idx_workspace_announcements_org
  on public.workspace_announcements(org_id, is_active, published_at desc);

alter table public.employee_profile_change_requests enable row level security;
alter table public.employee_tasks enable row level security;
alter table public.workspace_announcements enable row level security;

drop policy if exists "Employees view own profile change requests" on public.employee_profile_change_requests;
create policy "Employees view own profile change requests"
  on public.employee_profile_change_requests for select
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or requested_by = auth.uid()
    or exists (
      select 1 from public.employees e
      where e.id = employee_id and e.linked_user_id = auth.uid()
    )
  );

drop policy if exists "Employees create own profile change requests" on public.employee_profile_change_requests;
create policy "Employees create own profile change requests"
  on public.employee_profile_change_requests for insert
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.employees e
      where e.id = employee_id
        and e.org_id = org_id
        and e.linked_user_id = auth.uid()
    )
  );

drop policy if exists "HR reviews profile change requests" on public.employee_profile_change_requests;
create policy "HR reviews profile change requests"
  on public.employee_profile_change_requests for update
  using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_employees'));

drop policy if exists "Employees view assigned tasks" on public.employee_tasks;
create policy "Employees view assigned tasks"
  on public.employee_tasks for select
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.employees e
      where e.id = employee_id and e.linked_user_id = auth.uid()
    )
  );

drop policy if exists "Employees complete assigned tasks" on public.employee_tasks;
create policy "Employees complete assigned tasks"
  on public.employee_tasks for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

drop policy if exists "HR manages employee tasks" on public.employee_tasks;
create policy "HR manages employee tasks"
  on public.employee_tasks for all
  using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_employees'))
  with check (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_employees'));

drop policy if exists "Employees view workspace announcements" on public.workspace_announcements;
create policy "Employees view workspace announcements"
  on public.workspace_announcements for select
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
    and public.has_permission(org_id, 'view_self')
  );

drop policy if exists "HR manages workspace announcements" on public.workspace_announcements;
create policy "HR manages workspace announcements"
  on public.workspace_announcements for all
  using (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_settings'))
  with check (public.has_permission(org_id, 'all_hr') or public.has_permission(org_id, 'manage_settings'));

-- Let employees see and update only their own basic employee row through the portal.
drop policy if exists "Employees update own editable profile fields" on public.employees;
create policy "Employees update own editable profile fields"
  on public.employees for update
  using (linked_user_id = auth.uid())
  with check (linked_user_id = auth.uid());
