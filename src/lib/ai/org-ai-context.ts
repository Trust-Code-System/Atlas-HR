import type { SupabaseClient } from "@supabase/supabase-js";
import { dataOrEmpty } from "@/lib/supabase/schema";
import { AI_SKILLS, getAiSkill, type AiSkillMeta } from "@/lib/ai/skills-catalog";

/**
 * Human-readable names for connector / plugin integration ids. Mirrors the
 * catalogue rendered on the Integrations page so the AI can refer to tools by
 * name rather than slug.
 */
const INTEGRATION_NAMES: Record<string, string> = {
  slack: "Slack",
  teams: "Microsoft Teams",
  zoom: "Zoom",
  "google-meet": "Google Meet",
  quickbooks: "QuickBooks",
  xero: "Xero",
  sage: "Sage",
  stripe: "Stripe",
  linkedin: "LinkedIn Jobs",
  greenhouse: "Greenhouse",
  indeed: "Indeed",
  workable: "Workable",
  "google-workspace": "Google Workspace",
  "microsoft-365": "Microsoft 365",
  notion: "Notion",
  jira: "Jira",
  okta: "Okta",
  "google-sso": "Google SSO",
  "azure-ad": "Azure Active Directory",
  "slack-bot": "Slack Bot",
  "teams-bot": "Teams Bot",
  "chrome-ext": "Chrome Extension",
  "ios-app": "Mobile App (iOS)",
  "android-app": "Mobile App (Android)",
  "email-digest": "Email Digest",
  "calendar-sync": "Calendar Sync",
  "widget-embed": "Widget Embed",
};

function integrationName(id: string): string {
  return INTEGRATION_NAMES[id] ?? id;
}

export interface OrgAiContext {
  /** Skill metadata for the skills enabled in this workspace. */
  enabledSkills: AiSkillMeta[];
  /** Connected connector integration ids. */
  connectedConnectors: string[];
  /** Installed plugin integration ids. */
  installedPlugins: string[];
  /** Prebuilt system-prompt fragment describing the above (empty if nothing on). */
  promptFragment: string;
}

/**
 * Loads the integrations + AI skills enabled for an org so the assistant can be
 * "aware" of what the workspace has connected. Safe to call even when the
 * relevant tables are missing — it degrades to an empty context.
 */
export async function getOrgAiContext(
  // Loosely typed so either the SSR or service client can be passed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  orgId: string,
): Promise<OrgAiContext> {
  const [rawIntegrations, rawSkills] = await Promise.all([
    dataOrEmpty(
      supabase
        .from("org_integrations")
        .select("integration_id, integration_type, is_active")
        .eq("org_id", orgId),
    ),
    dataOrEmpty(
      supabase.from("org_enabled_skills").select("skill_id").eq("org_id", orgId),
    ),
  ]);

  const integrations = (rawIntegrations ?? []) as {
    integration_id: string;
    integration_type: string;
    is_active: boolean;
  }[];

  const connectedConnectors = integrations
    .filter((i) => i.is_active && i.integration_type === "connector")
    .map((i) => i.integration_id);
  const installedPlugins = integrations
    .filter((i) => i.is_active && i.integration_type === "plugin")
    .map((i) => i.integration_id);

  const enabledSkillIds = ((rawSkills ?? []) as { skill_id: string }[]).map(
    (s) => s.skill_id,
  );
  const enabledSkills = enabledSkillIds
    .map((id) => getAiSkill(id))
    .filter((s): s is AiSkillMeta => Boolean(s));

  const lines: string[] = [];
  if (connectedConnectors.length) {
    lines.push(
      `Connected integrations: ${connectedConnectors.map(integrationName).join(", ")}. You may reference these as available destinations/sources (e.g. "I can post this to Slack" or "sync to Google Workspace"), but never claim to have actually performed an external action.`,
    );
  }
  if (installedPlugins.length) {
    lines.push(`Installed plugins: ${installedPlugins.map(integrationName).join(", ")}.`);
  }
  if (enabledSkills.length) {
    lines.push(
      `Enabled AI skills the user can run: ${enabledSkills
        .map((s) => s.name)
        .join(", ")}. When a request matches one of these, you can perform it directly and may mention that a dedicated skill exists.`,
    );
  }

  const promptFragment = lines.length
    ? `\n\n--- This workspace's connected tools ---\n${lines.join("\n")}`
    : "";

  return { enabledSkills, connectedConnectors, installedPlugins, promptFragment };
}

/** All skills, used by the widget to show what could be enabled. */
export { AI_SKILLS };
