-- Learning & Development: courses, enrolments, certifications

create table if not exists lms_courses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  title         text not null,
  description   text null,
  category      text not null check (category in ('compliance','technical','soft_skills','leadership','onboarding','other')) default 'other',
  format        text not null check (format in ('video','document','live','external','scorm')) default 'document',
  duration_mins int null,
  thumbnail_url text null,
  external_url  text null,
  is_mandatory  boolean not null default false,
  status        text not null check (status in ('draft','published','archived')) default 'draft',
  created_by    uuid null references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists lms_enrolments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  course_id     uuid not null references lms_courses(id) on delete cascade,
  employee_id   uuid not null references employees(id) on delete cascade,
  status        text not null check (status in ('enrolled','in_progress','completed','failed','dropped')) default 'enrolled',
  progress_pct  int not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  score         int null check (score >= 0 and score <= 100),
  due_date      date null,
  started_at    timestamptz null,
  completed_at  timestamptz null,
  notes         text null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (course_id, employee_id)
);

create table if not exists lms_certifications (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id) on delete cascade,
  employee_id     uuid not null references employees(id) on delete cascade,
  course_id       uuid null references lms_courses(id) on delete set null,
  name            text not null,
  issuer          text null,
  issued_date     date null,
  expiry_date     date null,
  credential_url  text null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table lms_courses enable row level security;
alter table lms_enrolments enable row level security;
alter table lms_certifications enable row level security;

create policy "org members can view courses"
  on lms_courses for select using (is_org_member(org_id));

create policy "org admins can manage courses"
  on lms_courses for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

create policy "org members can view enrolments"
  on lms_enrolments for select using (is_org_member(org_id));

create policy "org admins can manage enrolments"
  on lms_enrolments for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

create policy "org members can view certifications"
  on lms_certifications for select using (is_org_member(org_id));

create policy "org admins can manage certifications"
  on lms_certifications for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));
