-- Complaint & Case Management (§20)
-- Intake form + AI classification + neutral-comms drafting + sensitive-case access control.
--
-- Run this in the Supabase SQL Editor.

-- Helper: is this user a workspace owner? (manage_admins is owner-only per role_permissions seed.)
create or replace function public.is_workspace_owner(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select public.has_permission(_org_id, 'manage_admins');
$$;

create table if not exists public.complaints (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organisations(id) on delete cascade,
  -- Reporter (kept for their own tracking; hidden from handlers in the UI when is_anonymous).
  reporter_user_id    uuid references auth.users(id) on delete set null,
  reporter_employee_id uuid references public.employees(id) on delete set null,
  is_anonymous        boolean not null default false,
  -- About whom (optional) + intake content
  subject_employee_id uuid references public.employees(id) on delete set null,
  title               text not null,
  description         text not null,
  category            text not null default 'other'
                      check (category in ('harassment','discrimination','bullying','safety','pay','management','policy','interpersonal','other')),
  severity            text not null default 'medium'
                      check (severity in ('low','medium','high','critical')),
  -- §28 access restriction: sensitive cases are visible only to the assigned
  -- handler and workspace owners (not general HR admins).
  is_sensitive        boolean not null default false,
  status              text not null default 'new'
                      check (status in ('new','triaging','investigating','resolved','dismissed','closed')),
  assigned_to         uuid references auth.users(id) on delete set null,
  resolution          text,
  ai_summary          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

create index if not exists complaints_org_idx on public.complaints (org_id, created_at desc);
create index if not exists complaints_reporter_idx on public.complaints (reporter_user_id);
create index if not exists complaints_assigned_idx on public.complaints (assigned_to);

alter table public.complaints enable row level security;

-- Any org member may file a complaint.
drop policy if exists "members can file complaints" on public.complaints;
create policy "members can file complaints"
  on public.complaints for insert
  with check (public.is_org_member(org_id) and reporter_user_id = auth.uid());

-- Visibility: own reports, the assigned handler, HR admins (non-sensitive only),
-- and workspace owners (sensitive cases).
drop policy if exists "view complaints" on public.complaints;
create policy "view complaints"
  on public.complaints for select
  using (
    reporter_user_id = auth.uid()
    or assigned_to = auth.uid()
    or (is_sensitive = false and public.is_org_admin(org_id))
    or (is_sensitive = true and public.is_workspace_owner(org_id))
  );

-- Management: the assigned handler, HR admins (non-sensitive), owners (sensitive).
drop policy if exists "manage complaints" on public.complaints;
create policy "manage complaints"
  on public.complaints for update
  using (
    assigned_to = auth.uid()
    or (is_sensitive = false and public.is_org_admin(org_id))
    or (is_sensitive = true and public.is_workspace_owner(org_id))
  )
  -- with_check is intentionally looser than using: it lets an HR admin escalate a
  -- visible case to sensitive (after which the using-clause hands ongoing control to
  -- workspace owners). is_workspace_owner ⊂ is_org_admin, so owners are covered.
  with check (
    assigned_to = auth.uid()
    or public.is_org_admin(org_id)
  );

-- Only workspace owners may delete a complaint record.
drop policy if exists "owners delete complaints" on public.complaints;
create policy "owners delete complaints"
  on public.complaints for delete
  using (public.is_workspace_owner(org_id));
