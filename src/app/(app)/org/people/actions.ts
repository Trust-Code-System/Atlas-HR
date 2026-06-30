"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { getUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { sendSlackNotification } from "@/lib/slack";

export type ActionResult = { error?: string; success?: boolean; id?: string } | null;

type EmployeePlacementRow = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  manager_id: string | null;
  is_department_head: boolean | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function revalidatePeopleViews(employeeId?: string) {
  if (employeeId) revalidatePath(`/org/people/${employeeId}`);
  revalidatePath("/org/people");
  revalidatePath("/org/chart");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/manager");
}

function normalize(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function isSeniorRole(title: string | null) {
  if (!title) return false;
  return /\b(ceo|chief|founder|president|vp|vice president|director|head)\b/i.test(title);
}

function isManagerRole(title: string | null) {
  if (!title) return false;
  return /\b(manager|lead|head|director|principal|senior)\b/i.test(title);
}

async function inferManagerId(
  supabase: SupabaseServerClient,
  orgId: string,
  department: string | null,
  jobTitle: string | null
) {
  if (isSeniorRole(jobTitle)) return null;

  const { data } = await supabase
    .from("employees")
    .select("id, full_name, job_title, department, manager_id, is_department_head")
    .eq("org_id", orgId)
    .neq("status", "terminated")
    .order("full_name");

  const employees = (data ?? []) as EmployeePlacementRow[];
  if (employees.length === 0) return null;

  const sameDepartment = department
    ? employees.filter((employee) => (employee.department ?? "").toLowerCase() === department.toLowerCase())
    : [];

  const candidates = sameDepartment.length > 0 ? sameDepartment : employees;
  const departmentHead = candidates.find((employee) => employee.is_department_head);
  if (departmentHead) return departmentHead.id;

  const seniorManager = candidates.find((employee) => isManagerRole(employee.job_title));
  if (seniorManager) return seniorManager.id;

  const rootManager = candidates.find((employee) => !employee.manager_id);
  return rootManager?.id ?? null;
}

async function createsReportingCycle(
  supabase: SupabaseServerClient,
  orgId: string,
  employeeId: string,
  nextManagerId: string | null
) {
  if (!nextManagerId) return false;
  if (nextManagerId === employeeId) return true;

  let currentId: string | null = nextManagerId;
  const seen = new Set<string>();

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const result = await supabase
      .from("employees")
      .select("id, manager_id")
      .eq("id", currentId)
      .eq("org_id", orgId)
      .maybeSingle();
    const data = result.data as { id: string; manager_id: string | null } | null;

    if (!data) return false;
    if (data.manager_id === employeeId) return true;
    currentId = data.manager_id;
  }

  return false;
}

export async function createEmployee(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData) return { error: "No organisation found" };
  if (!orgData.isAdmin) return { error: "Unauthorised" };

  const supabase = await createClient();
  const salary = formData.get("salary") as string;
  const requestedManagerId = normalize(formData.get("manager_id"));
  const fullName = normalize(formData.get("full_name"));
  const email = normalize(formData.get("email"));
  const jobTitle = normalize(formData.get("job_title"));
  const department = normalize(formData.get("department"));
  const managerId = requestedManagerId ?? await inferManagerId(supabase, orgData.org.id, department, jobTitle);

  if (!fullName) return { error: "Full name is required." };

  const { data, error } = await supabase
    .from("employees")
    .insert({
      org_id: orgData.org.id,
      full_name: fullName,
      email,
      job_title: jobTitle,
      department,
      employment_type:
        ((formData.get("employment_type") as string) ||
          null) as "full_time" | "part_time" | "contract" | "intern" | null,
      start_date: normalize(formData.get("start_date")),
      country: normalize(formData.get("country")),
      phone: normalize(formData.get("phone")),
      salary: salary ? Math.max(0, Math.min(parseFloat(salary), 100_000_000)) : null,
      salary_currency: (formData.get("salary_currency") as string) || "USD",
      manager_id: managerId,
      is_department_head: formData.get("is_department_head") === "on",
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePeopleViews();

  void sendSlackNotification(orgData.org.id, {
    title: "New employee added",
    body: `*${fullName}* has been added to ${orgData.org.name}.`,
    color: "#10b981",
    fields: [
      ...(jobTitle ? [{ title: "Role", value: jobTitle, short: true }] : []),
      ...(department ? [{ title: "Department", value: department, short: true }] : []),
    ],
  });

  return { success: true, id: data.id };
}

export async function updateEmployee(
  employeeId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData) return { error: "No organisation found" };
  if (!orgData.isAdmin) return { error: "Unauthorised" };

  const supabase = await createClient();

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("org_id", orgData.org.id)
    .single();

  if (!emp) return { error: "Employee not found" };

  const salary = formData.get("salary") as string;
  const managerId = normalize(formData.get("manager_id"));

  if (await createsReportingCycle(supabase, orgData.org.id, employeeId, managerId)) {
    return { error: "That manager would create a reporting loop in the org chart." };
  }

  const fullName = normalize(formData.get("full_name"));
  if (!fullName) return { error: "Full name is required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("employees")
    .update({
      full_name: fullName,
      email: normalize(formData.get("email")),
      job_title: normalize(formData.get("job_title")),
      department: normalize(formData.get("department")),
      employment_type:
        ((formData.get("employment_type") as string) ||
          null) as "full_time" | "part_time" | "contract" | "intern" | null,
      start_date: normalize(formData.get("start_date")),
      end_date: normalize(formData.get("end_date")),
      country: normalize(formData.get("country")),
      phone: normalize(formData.get("phone")),
      address: normalize(formData.get("address")),
      salary: salary ? Math.max(0, Math.min(parseFloat(salary), 100_000_000)) : null,
      salary_currency: (formData.get("salary_currency") as string) || "USD",
      manager_id: managerId,
      is_department_head: formData.get("is_department_head") === "on",
      emergency_contact_name: normalize(formData.get("emergency_contact_name")),
      emergency_contact_phone: normalize(formData.get("emergency_contact_phone")),
      linkedin_url: normalize(formData.get("linkedin_url")),
      notes: normalize(formData.get("notes")),
      status:
        ((formData.get("status") as string) ||
          "active") as "active" | "on_leave" | "terminated",
    })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePeopleViews(employeeId);
  return { success: true };
}

export interface CsvRow {
  full_name: string;
  email?: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  start_date?: string;
  country?: string;
  phone?: string;
  salary?: string;
  salary_currency?: string;
}

export interface BulkImportResult {
  error?: string;
  imported?: number;
  skipped?: number;
  errors?: { row: number; name: string; reason: string }[];
}

export async function bulkImportEmployees(rows: CsvRow[]): Promise<BulkImportResult> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgData = await getCurrentOrg();
  if (!orgData) return { error: "No organisation found" };
  if (!orgData.isAdmin) return { error: "Unauthorised" };
  if (!rows.length) return { error: "No rows to import" };
  if (rows.length > 500) return { error: "Maximum 500 rows per import" };

  const supabase = await createClient();
  let imported = 0;
  let skipped = 0;
  const errors: { row: number; name: string; reason: string }[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const fullName = row.full_name?.trim();
    if (!fullName) { skipped++; continue; }

    const salary = row.salary ? parseFloat(row.salary) : null;
    const managerId = await inferManagerId(supabase, orgData.org.id, row.department ?? null, row.job_title ?? null);

    const { error } = await supabase.from("employees").insert({
      org_id: orgData.org.id,
      full_name: fullName,
      email: row.email?.trim() || null,
      job_title: row.job_title?.trim() || null,
      department: row.department?.trim() || null,
      employment_type: (["full_time", "part_time", "contract", "intern"].includes(row.employment_type ?? "")
        ? row.employment_type
        : null) as "full_time" | "part_time" | "contract" | "intern" | null,
      start_date: row.start_date?.trim() || null,
      country: row.country?.trim() || null,
      phone: row.phone?.trim() || null,
      salary: isNaN(salary ?? NaN) ? null : salary,
      salary_currency: row.salary_currency?.trim() || "USD",
      manager_id: managerId,
      status: "active",
    });

    if (error) {
      errors.push({ row: idx + 2, name: fullName, reason: error.message });
    } else {
      imported++;
    }
  }

  if (imported > 0) {
    revalidatePeopleViews();

    void sendSlackNotification(orgData.org.id, {
      title: "Bulk employee import complete",
      body: `${imported} employee${imported !== 1 ? "s" : ""} were imported to ${orgData.org.name} via CSV.`,
      color: "#6366f1",
    });
  }

  return { imported, skipped, errors };
}
