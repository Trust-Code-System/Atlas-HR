-- Org integrations (connectors + plugins with real config)
CREATE TABLE IF NOT EXISTS org_integrations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  integration_id   text        NOT NULL,
  integration_type text        NOT NULL CHECK (integration_type IN ('connector', 'plugin')),
  config           jsonb       NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  connected_by     uuid        REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, integration_id)
);

ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select_integrations" ON org_integrations;
CREATE POLICY "org_members_select_integrations"
  ON org_integrations FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_admins_all_integrations" ON org_integrations;
CREATE POLICY "org_admins_all_integrations"
  ON org_integrations FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

-- Enabled AI skills per org
CREATE TABLE IF NOT EXISTS org_enabled_skills (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  skill_id    text        NOT NULL,
  enabled_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, skill_id)
);

ALTER TABLE org_enabled_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select_skills" ON org_enabled_skills;
CREATE POLICY "org_members_select_skills"
  ON org_enabled_skills FOR SELECT
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS "org_admins_all_skills" ON org_enabled_skills;
CREATE POLICY "org_admins_all_skills"
  ON org_enabled_skills FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));
