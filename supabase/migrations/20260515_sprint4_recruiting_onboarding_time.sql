-- Sprint 4: Recruiting (ATS), Time Tracking
-- Onboarding uses existing lifecycle_* tables — no new tables needed for it.
-- Run this in Supabase SQL Editor

-- ─── Recruiting ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  department      TEXT,
  location        TEXT,
  employment_type TEXT DEFAULT 'full_time',
  description     TEXT,
  requirements    TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('draft','open','closed','on_hold')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_name   TEXT NOT NULL,
  candidate_email  TEXT,
  candidate_phone  TEXT,
  stage            TEXT NOT NULL DEFAULT 'applied'
                   CHECK (stage IN ('applied','screening','interview','offer','hired','rejected')),
  notes            TEXT,
  cv_url           TEXT,
  applied_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Time Tracking ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS time_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  hours        NUMERIC(5,2) NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT 'regular'
               CHECK (category IN ('regular','overtime','sick','holiday','training')),
  project      TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','submitted','approved')),
  approved_by  UUID REFERENCES auth.users(id),
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date, category)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_jobs" ON jobs;
CREATE POLICY "org_members_jobs" ON jobs
  FOR ALL USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_members_job_applications" ON job_applications;
CREATE POLICY "org_members_job_applications" ON job_applications
  FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE is_org_member(org_id))
  );

DROP POLICY IF EXISTS "org_members_time_entries" ON time_entries;
CREATE POLICY "org_members_time_entries" ON time_entries
  FOR ALL USING (is_org_member(org_id));
