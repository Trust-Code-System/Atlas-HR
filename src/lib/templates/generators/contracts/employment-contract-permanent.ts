import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "us") {
  return buildTemplateBySlug("employment-contract-permanent", vars, variant);
}
