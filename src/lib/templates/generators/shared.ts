import { getTemplateSpec } from "../content";
import { buildTemplateDocument } from "../document";
import type { TemplateVariables, TemplateVariant } from "../variables";

export function buildTemplateBySlug(slug: string, vars: TemplateVariables = {}, variant: TemplateVariant = "global") {
  const spec = getTemplateSpec(slug);
  if (!spec) throw new Error(`Template spec not found: ${slug}`);
  return buildTemplateDocument(spec, vars, variant);
}
