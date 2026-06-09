"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";
import { encryptConfig } from "@/lib/crypto";

export type IntegrationActionResult = { error?: string; success?: boolean } | null;

export async function saveConnectorConfig(
  integrationId: string,
  integrationType: "connector" | "plugin",
  config: Record<string, string>,
): Promise<IntegrationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("org_integrations")
    .upsert(
      {
        org_id: orgCtx.org.id,
        integration_id: integrationId,
        integration_type: integrationType,
        // Encrypt secret values (tokens, webhook URLs, service-account JSON) at rest.
        config: encryptConfig(config),
        is_active: true,
        connected_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,integration_id" },
    );

  if (error) return { error: error.message };
  revalidatePath("/integrations");
  return { success: true };
}

export async function disconnectIntegration(
  integrationId: string,
): Promise<IntegrationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("org_integrations")
    .delete()
    .eq("org_id", orgCtx.org.id)
    .eq("integration_id", integrationId);

  if (error) return { error: error.message };
  revalidatePath("/integrations");
  return { success: true };
}

export async function toggleSkill(
  skillId: string,
  enable: boolean,
): Promise<IntegrationActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (enable) {
    const { error } = await supabase
      .from("org_enabled_skills")
      .upsert(
        { org_id: orgCtx.org.id, skill_id: skillId, enabled_by: user?.id ?? null },
        { onConflict: "org_id,skill_id" },
      );
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("org_enabled_skills")
      .delete()
      .eq("org_id", orgCtx.org.id)
      .eq("skill_id", skillId);
    if (error) return { error: error.message };
  }

  revalidatePath("/integrations");
  return { success: true };
}
