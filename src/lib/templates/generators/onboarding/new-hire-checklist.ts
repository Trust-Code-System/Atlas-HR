import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "global") {
  return buildTemplateBySlug("new-hire-checklist", vars, variant);
}
