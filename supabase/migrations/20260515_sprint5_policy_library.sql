-- Sprint 5: Policy Library

create table if not exists policy_library (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  file_url text,
  is_published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table policy_library enable row level security;

create policy "org members can view published policy library"
  on policy_library for select
  using (is_published = true and is_org_member(org_id));

create policy "org admins can manage policy library"
  on policy_library for all
  using (is_org_admin(org_id))
  with check (is_org_admin(org_id));

create index if not exists idx_policy_library_org_id on policy_library(org_id);
