-- Disciplinary Management: cases, warnings, queries, suspensions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS disciplinary_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'warning'
                 CHECK (type IN ('query','warning','suspension','termination','other')),
  severity       TEXT NOT NULL DEFAULT 'minor'
                 CHECK (severity IN ('minor','moderate','serious','gross_misconduct')),
  title          TEXT NOT NULL,
  description    TEXT,
  incident_date  DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','under_review','resolved','closed')),
  outcome        TEXT,
  resolved_at    TIMESTAMPTZ,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE disciplinary_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can view disciplinary cases" ON disciplinary_cases;
CREATE POLICY "org members can view disciplinary cases"
  ON disciplinary_cases FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org admins can manage disciplinary cases" ON disciplinary_cases;
CREATE POLICY "org admins can manage disciplinary cases"
  ON disciplinary_cases FOR ALL
  USING (is_org_admin(org_id));
