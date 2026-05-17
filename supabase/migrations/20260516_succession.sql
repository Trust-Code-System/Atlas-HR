-- Succession Planning: talent pool candidates with readiness and potential ratings

create table if not exists succession_candidates (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  employee_id      uuid not null references employees(id) on delete cascade,
  target_role      text not null,
  readiness        text not null check (readiness in ('ready_now','ready_1_year','ready_2_plus','not_ready')) default 'not_ready',
  potential        text not null check (potential in ('high','medium','low')) default 'medium',
  performance      text not null check (performance in ('exceeds','meets','below')) default 'meets',
  development_areas text null,
  notes            text null,
  status           text not null check (status in ('active','promoted','removed')) default 'active',
  nominated_by     uuid null references auth.users(id) on delete set null,
  promoted_at      timestamptz null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, employee_id, target_role)
);

-- RLS
alter table succession_candidates enable row level security;

create policy "org members can view succession candidates"
  on succession_candidates for select
  using (is_org_member(org_id));

create policy "org admins can manage succession candidates"
  on succession_candidates for all
  using (is_org_admin(org_id))
  with check (is_org_admin(org_id));
