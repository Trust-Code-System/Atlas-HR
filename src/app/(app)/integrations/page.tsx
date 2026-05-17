import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { IntegrationsClient } from "./integrations-client";
import { dataOrEmpty } from "@/lib/supabase/schema";

export const metadata: Metadata = { title: "Integrations | Atlas HR" };

export default async function IntegrationsPage() {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) redirect("/dashboard");

  const supabase = await createClient();

  const [rawIntegrations, rawSkills] = await Promise.all([
    dataOrEmpty(supabase
      .from("org_integrations")
      .select("integration_id, integration_type, config, is_active")
      .eq("org_id", orgCtx.org.id)),
    dataOrEmpty(supabase
      .from("org_enabled_skills")
      .select("skill_id")
      .eq("org_id", orgCtx.org.id)),
  ]);

  const connectedIds = (rawIntegrations ?? [])
    .filter((i) => i.is_active && i.integration_type === "connector")
    .map((i) => i.integration_id as string);

  const installedIds = (rawIntegrations ?? [])
    .filter((i) => i.is_active && i.integration_type === "plugin")
    .map((i) => i.integration_id as string);

  const enabledSkillIds = (rawSkills ?? []).map((s) => s.skill_id as string);

  return (
    <IntegrationsClient
      isAdmin={orgCtx.isAdmin}
      connectedIds={connectedIds}
      installedIds={installedIds}
      enabledSkillIds={enabledSkillIds}
    />
  );
}
