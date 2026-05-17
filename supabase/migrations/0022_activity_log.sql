-- Phase E.7: Universal activity log

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  actor_display_name text,
  resource_type text not null,
  resource_id uuid not null,
  resource_display_name text,
  action text not null,
  before_value jsonb,
  after_value jsonb,
  changed_fields text[],
  reason text,
  source text default 'web' check (source in ('web','api','system','import','webhook')),
  ip text,
  user_agent text,
  request_id text,
  created_at timestamptz default now()
);

create index if not exists idx_activity_org on public.activity_log(org_id, created_at desc);
create index if not exists idx_activity_resource on public.activity_log(resource_type, resource_id, created_at desc);
create index if not exists idx_activity_actor on public.activity_log(actor_user_id, created_at desc)
  where actor_user_id is not null;

alter table public.activity_log enable row level security;

drop policy if exists "View activity in workspace" on public.activity_log;
create policy "View activity in workspace" on public.activity_log
  for select using (
    exists (
      select 1 from public.org_members om
      where om.org_id = activity_log.org_id
        and om.user_id = auth.uid()
    )
    and (
      public.has_permission(org_id, 'all_hr')
      or public.has_permission(org_id, 'manage_employees')
      or public.has_permission(org_id, 'view_employees')
      or actor_user_id = auth.uid()
      or (
        resource_type = 'employee'
        and resource_id = (
          select e.id
          from public.employees e
          where e.linked_user_id = auth.uid()
             or exists (
               select 1 from public.profiles p
               where p.id = auth.uid() and lower(p.email) = lower(e.email)
             )
          limit 1
        )
      )
    )
  );

-- Append-only by policy: no update/delete policies are created.
