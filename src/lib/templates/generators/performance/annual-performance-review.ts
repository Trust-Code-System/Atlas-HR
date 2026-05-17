import { buildTemplateBySlug } from "../shared";
import type { TemplateVariables, TemplateVariant } from "../../variables";

export function buildTemplate(vars: TemplateVariables = {}, variant: TemplateVariant = "global") {
  return buildTemplateBySlug("annual-performance-review", vars, variant);
}
