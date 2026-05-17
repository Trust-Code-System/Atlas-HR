-- Company asset inventory and employee equipment assignments
CREATE TABLE IF NOT EXISTS company_assets (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  asset_type         text        NOT NULL DEFAULT 'other'
                                CHECK (asset_type IN ('laptop','desktop','monitor','phone','tablet','accessory','vehicle','license','card','other')),
  asset_tag          text,
  serial_number      text,
  manufacturer       text,
  model              text,
  condition          text        NOT NULL DEFAULT 'good'
                                CHECK (condition IN ('new','good','fair','damaged','repair_needed')),
  status             text        NOT NULL DEFAULT 'available'
                                CHECK (status IN ('available','assigned','repair','lost','retired')),
  purchase_date      date,
  warranty_expires   date,
  purchase_cost      numeric(12,2),
  currency           text        NOT NULL DEFAULT 'USD',
  location           text,
  notes              text,
  created_by         uuid        REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, asset_tag)
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  asset_id           uuid        NOT NULL REFERENCES company_assets(id) ON DELETE CASCADE,
  employee_id        uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at        date        NOT NULL DEFAULT current_date,
  return_due_at      date,
  returned_at        date,
  assignment_status  text        NOT NULL DEFAULT 'assigned'
                                CHECK (assignment_status IN ('assigned','returned','overdue','lost')),
  condition_out      text        CHECK (condition_out IN ('new','good','fair','damaged','repair_needed')),
  condition_in       text        CHECK (condition_in IN ('new','good','fair','damaged','repair_needed')),
  notes              text,
  assigned_by        uuid        REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS asset_assignments_one_active_per_asset
  ON asset_assignments(asset_id)
  WHERE assignment_status = 'assigned';

CREATE INDEX IF NOT EXISTS company_assets_org_status_idx
  ON company_assets(org_id, status);

CREATE INDEX IF NOT EXISTS asset_assignments_org_employee_idx
  ON asset_assignments(org_id, employee_id);

ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can view assets" ON company_assets;
CREATE POLICY "org members can view assets"
  ON company_assets FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org admins can manage assets" ON company_assets;
CREATE POLICY "org admins can manage assets"
  ON company_assets FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

DROP POLICY IF EXISTS "org members can view asset assignments" ON asset_assignments;
CREATE POLICY "org members can view asset assignments"
  ON asset_assignments FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org admins can manage asset assignments" ON asset_assignments;
CREATE POLICY "org admins can manage asset assignments"
  ON asset_assignments FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));
