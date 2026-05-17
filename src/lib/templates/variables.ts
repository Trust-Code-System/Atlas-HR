export type TemplateVariant = "global" | "us" | "uk" | "ng" | "in";

export type TemplateVariables = Partial<Record<StandardVariable, string>>;

export const STANDARD_VARIABLES = [
  "COMPANY_NAME",
  "COMPANY_ADDRESS",
  "EMPLOYEE_NAME",
  "EMPLOYEE_TITLE",
  "EMPLOYEE_START_DATE",
  "EMPLOYEE_END_DATE",
  "MANAGER_NAME",
  "HR_CONTACT",
  "SALARY",
  "CURRENCY",
  "COUNTRY",
  "EFFECTIVE_DATE",
  "NOTICE_PERIOD",
  "TODAY",
] as const;

export type StandardVariable = (typeof STANDARD_VARIABLES)[number];

export const blankVariables: Record<StandardVariable, string> = Object.fromEntries(
  STANDARD_VARIABLES.map((variable) => [variable, ""])
) as Record<StandardVariable, string>;

export function normalizeVariables(values: TemplateVariables = {}) {
  return {
    ...blankVariables,
    TODAY: new Date().toISOString().slice(0, 10),
    ...values,
  };
}

export function fill(value: string, variables: TemplateVariables = {}) {
  const normalized = normalizeVariables(variables);
  return value.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: StandardVariable) => {
    const replacement = normalized[key];
    return replacement && replacement.trim() ? replacement : `[${key}]`;
  });
}

export function variantLabel(variant: TemplateVariant) {
  const labels: Record<TemplateVariant, string> = {
    global: "Global",
    us: "United States",
    uk: "United Kingdom",
    ng: "Nigeria",
    in: "India",
  };
  return labels[variant];
}
