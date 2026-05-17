import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "uk") {
  return buildTemplateBySlug("employment-contract-fixed-term", vars, variant);
}
