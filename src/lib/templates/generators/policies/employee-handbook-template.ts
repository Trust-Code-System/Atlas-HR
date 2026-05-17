import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "global") {
  return buildTemplateBySlug("employee-handbook-template", vars, variant);
}
