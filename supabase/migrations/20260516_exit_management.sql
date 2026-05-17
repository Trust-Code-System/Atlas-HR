-- Exit Management: exit records and offboarding checklists

create table if not exists exit_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  employee_id   uuid not null references employees(id) on delete cascade,
  reason        text not null check (reason in ('resignation','termination','redundancy','retirement','contract_end','other')) default 'resignation',
  status        text not null check (status in ('initiated','in_progress','completed')) default 'initiated',
  last_working_day date null,
  exit_date      date null,
  exit_interview_date date null,
  exit_interview_notes text null,
  initiated_by  uuid null references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, employee_id)
);

create table if not exists exit_checklist_items (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  exit_id       uuid not null references exit_records(id) on delete cascade,
  category      text not null check (category in ('equipment','access','documentation','finance','other')) default 'other',
  title         text not null,
  description   text null,
  status        text not null check (status in ('pending','in_progress','completed','not_applicable')) default 'pending',
  due_date      date null,
  completed_at  timestamptz null,
  completed_by  uuid null references auth.users(id) on delete set null,
  notes         text null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS
alter table exit_records enable row level security;
alter table exit_checklist_items enable row level security;

create policy "org members can view exit records"
  on exit_records for select
  using (is_org_member(org_id));

create policy "org admins can manage exit records"
  on exit_records for all
  using (is_org_admin(org_id))
  with check (is_org_admin(org_id));

create policy "org members can view exit checklist items"
  on exit_checklist_items for select
  using (is_org_member(org_id));

create policy "org admins can manage exit checklist items"
  on exit_checklist_items for all
  using (is_org_admin(org_id))
  with check (is_org_admin(org_id));
