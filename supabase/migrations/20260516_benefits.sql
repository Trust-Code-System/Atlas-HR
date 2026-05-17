-- Benefits Management: plans and employee enrolments
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS benefit_plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL DEFAULT 'other'
                         CHECK (type IN ('health','dental','vision','pension','life','other')),
  provider               TEXT,
  description            TEXT,
  employer_contribution  NUMERIC(5,2) NOT NULL DEFAULT 0,
  employee_contribution  NUMERIC(5,2) NOT NULL DEFAULT 0,
  currency               TEXT NOT NULL DEFAULT 'GBP',
  status                 TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','inactive','archived')),
  renewal_date           DATE,
  created_by             UUID REFERENCES auth.users(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS benefit_enrolments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  plan_id      UUID NOT NULL REFERENCES benefit_plans(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','pending','opted_out','terminated')),
  start_date   DATE,
  end_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, employee_id)
);

ALTER TABLE benefit_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_enrolments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can view benefit plans" ON benefit_plans;
CREATE POLICY "org members can view benefit plans"
  ON benefit_plans FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org admins can manage benefit plans" ON benefit_plans;
CREATE POLICY "org admins can manage benefit plans"
  ON benefit_plans FOR ALL
  USING (is_org_admin(org_id));

DROP POLICY IF EXISTS "org members can view benefit enrolments" ON benefit_enrolments;
CREATE POLICY "org members can view benefit enrolments"
  ON benefit_enrolments FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org admins can manage benefit enrolments" ON benefit_enrolments;
CREATE POLICY "org admins can manage benefit enrolments"
  ON benefit_enrolments FOR ALL
  USING (is_org_admin(org_id));
