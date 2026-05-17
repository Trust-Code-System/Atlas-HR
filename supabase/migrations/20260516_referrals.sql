-- Employee Job Referrals

create table if not exists job_referrals (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  job_id           uuid not null references jobs(id) on delete cascade,
  referrer_id      uuid not null references employees(id) on delete cascade,
  candidate_name   text not null,
  candidate_email  text not null,
  candidate_phone  text null,
  linkedin_url     text null,
  relationship     text null,
  cover_note       text null,
  status           text not null check (status in ('pending','reviewing','interviewing','hired','rejected')) default 'pending',
  rejection_reason text null,
  hired_at         timestamptz null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RLS
alter table job_referrals enable row level security;

create policy "org members can view referrals"
  on job_referrals for select
  using (is_org_member(org_id));

create policy "org admins can manage referrals"
  on job_referrals for all
  using (is_org_admin(org_id))
  with check (is_org_admin(org_id));

create policy "employees can insert their own referrals"
  on job_referrals for insert
  with check (is_org_member(org_id));
