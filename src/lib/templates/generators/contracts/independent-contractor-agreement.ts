import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "us") {
  return buildTemplateBySlug("independent-contractor-agreement", vars, variant);
}
