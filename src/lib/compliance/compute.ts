import { createAdminClient } from "@/lib/supabase/admin";

type EmployeeRow = {
  id: string;
  org_id: string;
  job_title: string | null;
  country: string | null;
  employment_type: string | null;
};

type TemplateRow = {
  id: string;
  applies_to_country: string[] | null;
  applies_to_employment_type: string[] | null;
  applies_to_role_pattern: string | null;
};

type RequirementRow = {
  doc_type: string;
  expiry_warning_days: number | null;
};

type DocumentRow = {
  id: string;
  doc_type: string;
  expires_at: string | null;
};

function countryMatches(employeeCountry: string | null, countries: string[] | null) {
  if (!countries || countries.length === 0) return true;
  const employee = (employeeCountry ?? "").toLowerCase();
  return countries.some((country) => employee === country.toLowerCase() || employee.includes(country.toLowerCase()));
}

function employmentTypeMatches(employeeType: string | null, types: string[] | null) {
  if (!types || types.length === 0) return true;
  return Boolean(employeeType && types.includes(employeeType));
}

function roleMatches(jobTitle: string | null, pattern: string | null) {
  if (!pattern) return true;
  try {
    return new RegExp(pattern, "i").test(jobTitle ?? "");
  } catch {
    return false;
  }
}

function documentStatus(document: DocumentRow | undefined, warningDays: number | null) {
  if (!document) return "missing";
  if (!document.expires_at) return "approved";

  const now = new Date();
  const expiry = new Date(document.expires_at);
  if (expiry < now) return "expired";

  const warning = new Date(now);
  warning.setDate(now.getDate() + (warningDays ?? 30));
  if (expiry <= warning) return "expiring_soon";

  return "approved";
}

export async function recomputeEmployeeCompliance(employeeId: string) {
  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("employees")
    .select("id, org_id, job_title, country, employment_type")
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee) return { checked: 0 };
  return recomputeComplianceForEmployees([employee as EmployeeRow]);
}

export async function recomputeOrgCompliance(orgId: string) {
  const admin = createAdminClient();
  const { data: employees } = await admin
    .from("employees")
    .select("id, org_id, job_title, country, employment_type")
    .eq("org_id", orgId)
    .neq("status", "terminated");

  return recomputeComplianceForEmployees((employees ?? []) as EmployeeRow[]);
}

export async function recomputeAllCompliance() {
  const admin = createAdminClient();
  const { data: employees } = await admin
    .from("employees")
    .select("id, org_id, job_title, country, employment_type")
    .neq("status", "terminated");

  return recomputeComplianceForEmployees((employees ?? []) as EmployeeRow[]);
}

async function recomputeComplianceForEmployees(employees: EmployeeRow[]) {
  const admin = createAdminClient();
  let checked = 0;

  for (const employee of employees) {
    const [{ data: templates }, { data: documents }] = await Promise.all([
      admin
        .from("document_requirement_templates")
        .select("id, applies_to_country, applies_to_employment_type, applies_to_role_pattern")
        .eq("org_id", employee.org_id)
        .eq("is_active", true),
      admin
        .from("employee_documents")
        .select("id, doc_type, expires_at")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false }),
    ]);

    const applicableTemplateIds = ((templates ?? []) as TemplateRow[])
      .filter(
        (template) =>
          countryMatches(employee.country, template.applies_to_country) &&
          employmentTypeMatches(employee.employment_type, template.applies_to_employment_type) &&
          roleMatches(employee.job_title, template.applies_to_role_pattern)
      )
      .map((template) => template.id);

    if (applicableTemplateIds.length === 0) continue;

    const { data: requirements } = await admin
      .from("document_requirements")
      .select("doc_type, expiry_warning_days")
      .in("template_id", applicableTemplateIds)
      .eq("is_required", true);

    const documentsByType = new Map<string, DocumentRow>();
    for (const document of ((documents ?? []) as DocumentRow[])) {
      if (!documentsByType.has(document.doc_type)) documentsByType.set(document.doc_type, document);
    }

    for (const requirement of ((requirements ?? []) as RequirementRow[])) {
      const currentDocument = documentsByType.get(requirement.doc_type);
      const status = documentStatus(currentDocument, requirement.expiry_warning_days);
      const { error } = await admin.from("employee_document_status").upsert(
        {
          employee_id: employee.id,
          doc_type: requirement.doc_type,
          status,
          current_document_id: currentDocument?.id ?? null,
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,doc_type" }
      );

      if (!error) checked += 1;
    }
  }

  return { checked };
}
