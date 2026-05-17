-- Phase E.1: granular workspace roles and permission helpers.
-- 0015 is already used by beta migrations in this repo, so this migration
-- uses the next available sequence number.

alter table public.org_members
  add column if not exists roles text[] not null default array['employee']::text[];

update public.org_members
set roles = array['workspace_owner','hr_admin']::text[]
where org_role = 'admin'
  and roles = array['employee']::text[];

update public.org_members
set roles = array['employee']::text[]
where org_role = 'member'
  and roles = array['employee']::text[];

alter table public.org_invites
  add column if not exists roles text[] not null default array['employee']::text[];

update public.org_invites
set roles = array['workspace_owner','hr_admin']::text[]
where org_role = 'admin'
  and roles = array['employee']::text[];

update public.org_invites
set roles = array['employee']::text[]
where org_role = 'member'
  and roles = array['employee']::text[];

create table if not exists public.role_permissions (
  role text primary key,
  permissions jsonb not null default '{}'::jsonb
);

insert into public.role_permissions (role, permissions) values
  ('workspace_owner', '{"billing":true,"manage_org":true,"manage_admins":true,"all_hr":true}'),
  ('hr_admin', '{"all_hr":true,"manage_employees":true,"manage_documents":true,"approve_all":true,"view_compensation":true,"view_reports":true,"manage_settings":true}'),
  ('hr_manager', '{"manage_employees":true,"manage_documents":true,"approve_all":true,"view_reports":true}'),
  ('finance', '{"view_compensation":true,"view_payroll":true,"export_compensation":true}'),
  ('people_manager', '{"view_team":true,"approve_team":true,"review_team":true}'),
  ('recruiter', '{"manage_candidates":true,"manage_jobs":true}'),
  ('employee', '{"view_self":true,"submit_self":true}'),
  ('viewer', '{"view_employees":true,"view_reports":true}')
on conflict (role) do update set permissions = excluded.permissions;

create table if not exists public.org_role_audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  member_id uuid references public.org_members(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  before_roles text[] not null default '{}'::text[],
  after_roles text[] not null default '{}'::text[],
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_org_role_audit_org
  on public.org_role_audit_log(org_id, created_at desc);

alter table public.org_role_audit_log enable row level security;

create or replace function public.has_permission(_org_id uuid, _permission text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1
    from public.org_members om
    join public.role_permissions rp on rp.role = any(om.roles)
    where om.org_id = _org_id
      and om.user_id = auth.uid()
      and coalesce((rp.permissions ->> _permission)::boolean, false) = true
  );
$$;

create or replace function public.is_org_admin(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select public.has_permission(_org_id, 'all_hr')
    or public.has_permission(_org_id, 'manage_org')
    or public.has_permission(_org_id, 'manage_admins');
$$;

create or replace function public.is_org_member(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = _org_id and user_id = auth.uid()
  );
$$;

create or replace function public.manages_employee(_employee_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  current_id uuid;
  user_employee_id uuid;
  target_org_id uuid;
begin
  select org_id into target_org_id
  from public.employees
  where id = _employee_id;

  if target_org_id is null then
    return false;
  end if;

  select e.id into user_employee_id
  from public.employees e
  join public.profiles p on p.email = e.email
  where p.id = auth.uid()
    and e.org_id = target_org_id
  limit 1;

  if user_employee_id is null then
    return false;
  end if;

  current_id := _employee_id;
  for i in 1..10 loop
    select manager_id into current_id
    from public.employees
    where id = current_id;

    if current_id is null then
      return false;
    end if;

    if current_id = user_employee_id then
      return true;
    end if;
  end loop;

  return false;
end $$;

drop policy if exists "Org admins can update org" on public.organisations;
drop policy if exists "Org admins can delete org" on public.organisations;

create policy "Workspace owners can update workspace"
  on public.organisations for update
  using (
    public.has_permission(id, 'manage_org')
    or public.has_permission(id, 'manage_settings')
  );

create policy "Workspace owners can delete workspace"
  on public.organisations for delete
  using (public.has_permission(id, 'manage_org'));

drop policy if exists "Org admins can manage members" on public.org_members;

create policy "Workspace owners can add members"
  on public.org_members for insert
  with check (public.has_permission(org_id, 'manage_admins'));

create policy "Workspace owners can update members"
  on public.org_members for update
  using (public.has_permission(org_id, 'manage_admins'))
  with check (public.has_permission(org_id, 'manage_admins'));

drop policy if exists "Org members can view employees" on public.employees;
drop policy if exists "Org admins can manage employees" on public.employees;

create policy "View employees by permission"
  on public.employees for select
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'view_employees')
    or (
      public.has_permission(org_id, 'view_team')
      and public.manages_employee(id)
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.email = employees.email
    )
  );

create policy "Manage employees by permission"
  on public.employees for all
  using (
    public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'all_hr')
  )
  with check (
    public.has_permission(org_id, 'manage_employees')
    or public.has_permission(org_id, 'all_hr')
  );

drop policy if exists "Org admins can manage employee documents" on public.employee_documents;
drop policy if exists "Org members can view employee documents" on public.employee_documents;

create policy "View employee documents by permission"
  on public.employee_documents for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
          or (
            public.has_permission(e.org_id, 'view_team')
            and public.manages_employee(e.id)
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create policy "Manage employee documents by permission"
  on public.employee_documents for all
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
        )
    )
  )
  with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
        )
    )
  );

drop policy if exists "Org members can view leave requests in their orgs" on public.leave_requests;
drop policy if exists "Org admins can manage leave requests" on public.leave_requests;

create policy "View leave requests by permission"
  on public.leave_requests for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_employees')
          or (
            public.has_permission(e.org_id, 'view_team')
            and public.manages_employee(e.id)
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create policy "Create leave requests by permission"
  on public.leave_requests for insert
  with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_employees')
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create policy "Approve leave requests by permission"
  on public.leave_requests for update
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'approve_all')
          or public.has_permission(e.org_id, 'all_hr')
          or (
            public.has_permission(e.org_id, 'approve_team')
            and public.manages_employee(e.id)
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'approve_all')
          or public.has_permission(e.org_id, 'all_hr')
          or (
            public.has_permission(e.org_id, 'approve_team')
            and public.manages_employee(e.id)
          )
        )
    )
  );

drop policy if exists "Org admins can manage invites" on public.org_invites;

create policy "Workspace owners can manage invites"
  on public.org_invites for all
  using (public.has_permission(org_id, 'manage_admins'))
  with check (public.has_permission(org_id, 'manage_admins'));

drop policy if exists "Admins can view org role audit log" on public.org_role_audit_log;

create policy "Admins can view org role audit log"
  on public.org_role_audit_log for select
  using (
    public.has_permission(org_id, 'manage_admins')
    or public.has_permission(org_id, 'all_hr')
  );

drop policy if exists "Users see own subscriptions" on public.subscriptions;
drop policy if exists "Users see own invoices" on public.invoices;

do $$
begin
  if to_regclass('public.subscriptions') is not null then
    create policy "Workspace billing users can view subscriptions"
      on public.subscriptions for select
      using (
        user_id = auth.uid()
        or (
          org_id is not null
          and public.has_permission(org_id, 'billing')
        )
      );

    create policy "Workspace billing users can manage subscriptions"
      on public.subscriptions for all
      using (
        user_id = auth.uid()
        or (
          org_id is not null
          and public.has_permission(org_id, 'billing')
        )
      )
      with check (
        user_id = auth.uid()
        or (
          org_id is not null
          and public.has_permission(org_id, 'billing')
        )
      );

    create policy "Workspace billing users can view invoices"
      on public.invoices for select
      using (
        user_id = auth.uid()
        or (
          org_id is not null
          and public.has_permission(org_id, 'billing')
        )
      );
  end if;
end $$;
