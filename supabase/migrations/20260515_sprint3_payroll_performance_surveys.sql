-- Sprint 3: Payroll, Performance Cycles, Surveys
-- Run this in Supabase SQL Editor

-- ─── Payroll ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end  DATE NOT NULL,
  run_date        DATE,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','processing','approved','paid')),
  total_gross     NUMERIC(14,2),
  total_net       NUMERIC(14,2),
  currency        TEXT NOT NULL DEFAULT 'GBP',
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  gross_pay   NUMERIC(14,2) NOT NULL DEFAULT 0,
  deductions  NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_pay     NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Performance ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_cycles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'annual'
              CHECK (type IN ('annual','mid_year','quarterly','custom')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','active','completed')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id              UUID NOT NULL REFERENCES performance_cycles(id) ON DELETE CASCADE,
  employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id           UUID REFERENCES employees(id),
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','submitted','acknowledged')),
  rating                SMALLINT CHECK (rating BETWEEN 1 AND 5),
  summary               TEXT,
  strengths             TEXT,
  areas_for_improvement TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Surveys ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS surveys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'pulse'
              CHECK (type IN ('enps','pulse','custom')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','active','closed')),
  questions   JSONB NOT NULL DEFAULT '[]',
  ends_at     TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id      UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id  UUID REFERENCES employees(id),
  responses      JSONB NOT NULL DEFAULT '{}',
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Enable RLS on all new tables
ALTER TABLE payroll_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys            ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses   ENABLE ROW LEVEL SECURITY;

-- Payroll: org members only
DROP POLICY IF EXISTS "org_members_payroll_runs" ON payroll_runs;
CREATE POLICY "org_members_payroll_runs" ON payroll_runs
  FOR ALL USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_members_payroll_entries" ON payroll_entries;
CREATE POLICY "org_members_payroll_entries" ON payroll_entries
  FOR ALL USING (
    run_id IN (SELECT id FROM payroll_runs WHERE is_org_member(org_id))
  );

-- Performance: org members only
DROP POLICY IF EXISTS "org_members_performance_cycles" ON performance_cycles;
CREATE POLICY "org_members_performance_cycles" ON performance_cycles
  FOR ALL USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_members_performance_reviews" ON performance_reviews;
CREATE POLICY "org_members_performance_reviews" ON performance_reviews
  FOR ALL USING (
    cycle_id IN (SELECT id FROM performance_cycles WHERE is_org_member(org_id))
  );

-- Surveys: org members only
DROP POLICY IF EXISTS "org_members_surveys" ON surveys;
CREATE POLICY "org_members_surveys" ON surveys
  FOR ALL USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_members_survey_responses" ON survey_responses;
CREATE POLICY "org_members_survey_responses" ON survey_responses
  FOR ALL USING (
    survey_id IN (SELECT id FROM surveys WHERE is_org_member(org_id))
  );
