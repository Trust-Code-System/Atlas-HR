"use server";

import { getCurrentOrg } from "@/lib/org/get-current-org";
import { isMissingSchemaObject } from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

export type DemoSeedResult = {
  success?: boolean;
  error?: string;
  summary?: string[];
} | null;

const DEMO_EMAIL_DOMAIN = "atlas-demo.example";
const DEMO_DOC_PREFIX = "Atlas Demo";

type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
type CompanyAssetInsert = Database["public"]["Tables"]["company_assets"]["Insert"];
type AssetAssignmentInsert = Database["public"]["Tables"]["asset_assignments"]["Insert"];

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function monthDate(monthOffset: number, day = 25) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(day);
  return date.toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ignoreMissing<T>(query: PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>) {
  const result = await query;
  if (result.error && !isMissingSchemaObject(result.error)) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function seedDemoWorkspace(_previousState?: DemoSeedResult): Promise<DemoSeedResult> {
  void _previousState;

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Create or join a workspace before loading demo data." };
  if (!orgCtx.isAdmin) return { error: "Only workspace admins can load demo data." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before loading demo data." };

  const orgId = orgCtx.org.id;
  const userId = user.id;

  try {
    const { data: demoEmployees } = await supabase
      .from("employees")
      .select("id")
      .eq("org_id", orgId)
      .ilike("email", `%@${DEMO_EMAIL_DOMAIN}`);
    const demoEmployeeIds = (demoEmployees ?? []).map((employee) => employee.id);

    const demoAssets = await ignoreMissing(
      supabase
        .from("company_assets")
        .select("id")
        .eq("org_id", orgId)
        .ilike("asset_tag", "DEMO-%")
    );
    const demoAssetIds = (demoAssets ?? []).map((asset) => asset.id);

    const { data: demoJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("org_id", orgId)
      .ilike("title", "Demo:%");
    const demoJobIds = (demoJobs ?? []).map((job) => job.id);

    const { data: demoPayrollRuns } = await supabase
      .from("payroll_runs")
      .select("id")
      .eq("org_id", orgId)
      .ilike("name", "Demo:%");
    const demoPayrollRunIds = (demoPayrollRuns ?? []).map((run) => run.id);

    const { data: demoCycles } = await supabase
      .from("performance_cycles")
      .select("id")
      .eq("org_id", orgId)
      .ilike("name", "Demo:%");
    const demoCycleIds = (demoCycles ?? []).map((cycle) => cycle.id);

    const { data: demoSurveys } = await supabase
      .from("surveys")
      .select("id")
      .eq("org_id", orgId)
      .ilike("title", "Demo:%");
    const demoSurveyIds = (demoSurveys ?? []).map((survey) => survey.id);

    const demoBenefitPlans = await ignoreMissing(
      supabase
        .from("benefit_plans")
        .select("id")
        .eq("org_id", orgId)
        .ilike("name", "Demo:%")
    );
    const demoBenefitPlanIds = (demoBenefitPlans ?? []).map((plan) => plan.id);

    const demoCourses = await ignoreMissing(
      supabase
        .from("lms_courses")
        .select("id")
        .eq("org_id", orgId)
        .ilike("title", "Demo:%")
    );
    const demoCourseIds = (demoCourses ?? []).map((course) => course.id);

    const demoExits = demoEmployeeIds.length
      ? await ignoreMissing(
          supabase
            .from("exit_records")
            .select("id")
            .eq("org_id", orgId)
            .in("employee_id", demoEmployeeIds)
        )
      : [];
    const demoExitIds = (demoExits ?? []).map((exit) => exit.id);

    if (demoJobIds.length) await ignoreMissing(supabase.from("job_referrals").delete().in("job_id", demoJobIds));
    if (demoJobIds.length) await ignoreMissing(supabase.from("job_applications").delete().in("job_id", demoJobIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("succession_candidates").delete().in("employee_id", demoEmployeeIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("disciplinary_cases").delete().in("employee_id", demoEmployeeIds));
    if (demoExitIds.length) await ignoreMissing(supabase.from("exit_checklist_items").delete().in("exit_id", demoExitIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("exit_records").delete().in("employee_id", demoEmployeeIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("lms_certifications").delete().in("employee_id", demoEmployeeIds));
    if (demoCourseIds.length) await ignoreMissing(supabase.from("lms_enrolments").delete().in("course_id", demoCourseIds));
    if (demoCourseIds.length) await ignoreMissing(supabase.from("lms_courses").delete().in("id", demoCourseIds));
    if (demoBenefitPlanIds.length) await ignoreMissing(supabase.from("benefit_enrolments").delete().in("plan_id", demoBenefitPlanIds));
    if (demoBenefitPlanIds.length) await ignoreMissing(supabase.from("benefit_plans").delete().in("id", demoBenefitPlanIds));
    if (demoSurveyIds.length) await ignoreMissing(supabase.from("survey_responses").delete().in("survey_id", demoSurveyIds));
    if (demoSurveyIds.length) await ignoreMissing(supabase.from("surveys").delete().in("id", demoSurveyIds));
    if (demoCycleIds.length) await ignoreMissing(supabase.from("performance_reviews").delete().in("cycle_id", demoCycleIds));
    if (demoCycleIds.length) await ignoreMissing(supabase.from("performance_cycles").delete().in("id", demoCycleIds));
    if (demoPayrollRunIds.length) await ignoreMissing(supabase.from("payroll_entries").delete().in("run_id", demoPayrollRunIds));
    if (demoPayrollRunIds.length) await ignoreMissing(supabase.from("payroll_runs").delete().in("id", demoPayrollRunIds));
    if (demoAssetIds.length) await ignoreMissing(supabase.from("asset_assignments").delete().in("asset_id", demoAssetIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("asset_assignments").delete().in("employee_id", demoEmployeeIds));
    if (demoAssetIds.length) await ignoreMissing(supabase.from("company_assets").delete().in("id", demoAssetIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("time_entries").delete().in("employee_id", demoEmployeeIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("leave_requests").delete().in("employee_id", demoEmployeeIds));
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("employee_documents").delete().in("employee_id", demoEmployeeIds));
    if (demoJobIds.length) await ignoreMissing(supabase.from("jobs").delete().in("id", demoJobIds));

    await ignoreMissing(supabase.from("policy_library").delete().eq("org_id", orgId).ilike("title", "Demo:%"));
    await ignoreMissing(supabase.from("org_integrations").delete().eq("org_id", orgId).in("integration_id", ["slack", "google-workspace", "bamboohr", "quickbooks", "greenhouse"]));
    await ignoreMissing(supabase.from("org_enabled_skills").delete().eq("org_id", orgId).in("skill_id", ["leave-risk-brief", "payroll-explain", "candidate-screen", "policy-gap-check"]));
    await supabase.from("generated_documents").delete().eq("user_id", userId).ilike("title", `${DEMO_DOC_PREFIX}%`);
    await supabase.from("notifications").delete().eq("user_id", userId).ilike("title", "Demo:%");
    if (demoEmployeeIds.length) await ignoreMissing(supabase.from("employees").delete().in("id", demoEmployeeIds));

    const employeesToInsert = [
      ["Amina Okafor", "amina.okafor", "Chief People Officer", "People", "active", "full_time", "Nigeria", 148000, true],
      ["Daniel Reed", "daniel.reed", "Engineering Manager", "Engineering", "active", "full_time", "United Kingdom", 132000, true],
      ["Priya Nair", "priya.nair", "Senior Product Designer", "Product", "active", "full_time", "India", 98000, false],
      ["Marcus Stanton", "marcus.stanton", "Sales Lead", "Sales", "active", "full_time", "United States", 121000, true],
      ["Lydia Bergson", "lydia.bergson", "Payroll Specialist", "Finance", "active", "full_time", "United Kingdom", 76000, false],
      ["Chinedu Adeyemi", "chinedu.adeyemi", "HR Operations Analyst", "People", "on_leave", "full_time", "Nigeria", 64000, false],
      ["Sofia Alvarez", "sofia.alvarez", "Recruiter", "Talent", "active", "full_time", "United States", 84000, false],
      ["Noah Chen", "noah.chen", "Frontend Engineer", "Engineering", "active", "full_time", "United States", 118000, false],
      ["Grace Mensah", "grace.mensah", "Customer Success Manager", "Customer Success", "active", "full_time", "Ghana", 91000, false],
      ["Oliver Hart", "oliver.hart", "Data Analyst", "Analytics", "active", "contract", "United Kingdom", 87000, false],
      ["Fatima Bello", "fatima.bello", "Compliance Officer", "Legal", "active", "full_time", "Nigeria", 96000, true],
      ["Ethan Brooks", "ethan.brooks", "Account Executive", "Sales", "terminated", "full_time", "United States", 92000, false],
    ] as const;

    const { data: insertedEmployees, error: employeeError } = await supabase
      .from("employees")
      .insert(
        employeesToInsert.map(([fullName, emailPrefix, jobTitle, department, status, employmentType, country, salary, isDepartmentHead], index) => ({
          org_id: orgId,
          full_name: fullName,
          email: `${emailPrefix}@${DEMO_EMAIL_DOMAIN}`,
          job_title: jobTitle,
          department,
          status,
          employment_type: employmentType,
          country,
          salary,
          salary_currency: "USD",
          start_date: isoDate(-420 + index * 34),
          end_date: status === "terminated" ? isoDate(-14) : null,
          phone: `+1 555 010${index}`,
          address: `${20 + index} Demo Street, Global City`,
          emergency_contact_name: "Demo Emergency Contact",
          emergency_contact_phone: `+1 555 020${index}`,
          is_department_head: isDepartmentHead,
          linked_user_id: index === 0 ? userId : null,
          notes: "Atlas demo record for product walkthroughs.",
        }))
      )
      .select("id, full_name, email, department, job_title, salary");

    if (employeeError) throw new Error(employeeError.message);
    const employees = insertedEmployees ?? [];
    const byName = Object.fromEntries(employees.map((employee) => [employee.full_name, employee]));
    const activeEmployees = employees.filter((employee) => employee.full_name !== "Ethan Brooks");

    await supabase
      .from("employees")
      .update({ manager_id: byName["Daniel Reed"]?.id })
      .eq("org_id", orgId)
      .in("full_name", ["Priya Nair", "Noah Chen", "Oliver Hart"]);
    await supabase
      .from("employees")
      .update({ manager_id: byName["Marcus Stanton"]?.id })
      .eq("org_id", orgId)
      .in("full_name", ["Grace Mensah", "Ethan Brooks"]);
    await supabase
      .from("employees")
      .update({ manager_id: byName["Amina Okafor"]?.id })
      .eq("org_id", orgId)
      .in("full_name", ["Chinedu Adeyemi", "Sofia Alvarez", "Fatima Bello", "Lydia Bergson"]);

    await ignoreMissing(
      supabase.from("employee_documents").insert(
        activeEmployees.slice(0, 8).flatMap((employee, index) => [
          {
            employee_id: employee.id,
            doc_type: "employment_contract",
            file_name: `${slugify(employee.full_name)}-contract.pdf`,
            file_url: "https://example.com/demo/employment-contract.pdf",
            expires_at: null,
            uploaded_by: userId,
          },
          {
            employee_id: employee.id,
            doc_type: "government_id",
            file_name: `${slugify(employee.full_name)}-id.pdf`,
            file_url: "https://example.com/demo/government-id.pdf",
            expires_at: isoDate(index % 3 === 0 ? 18 : 220),
            uploaded_by: userId,
          },
        ])
      )
    );

    await ignoreMissing(
      supabase.from("leave_requests").insert([
        { employee_id: byName["Chinedu Adeyemi"].id, leave_type: "annual", start_date: isoDate(-2), end_date: isoDate(3), reason: "Family travel", status: "approved", approver_id: userId, approved_at: isoDateTime(-5) },
        { employee_id: byName["Priya Nair"].id, leave_type: "personal", start_date: isoDate(7), end_date: isoDate(8), reason: "Personal appointment", status: "pending" },
        { employee_id: byName["Noah Chen"].id, leave_type: "sick", start_date: isoDate(-1), end_date: isoDate(0), reason: "Flu symptoms", status: "approved", approver_id: userId, approved_at: isoDateTime(-1) },
        { employee_id: byName["Grace Mensah"].id, leave_type: "annual", start_date: isoDate(16), end_date: isoDate(22), reason: "Holiday", status: "pending" },
        { employee_id: byName["Oliver Hart"].id, leave_type: "unpaid", start_date: isoDate(31), end_date: isoDate(34), reason: "Extended travel", status: "rejected", approver_id: userId },
      ])
    );

    const timeEntries: TimeEntryInsert[] = activeEmployees.flatMap((employee, employeeIndex) =>
      Array.from({ length: 18 }, (_, dayIndex) => {
        const offset = -dayIndex;
        const weekend = [0, 6].includes(new Date(isoDate(offset)).getDay());
        const category: TimeEntryInsert["category"] =
          (employeeIndex + dayIndex) % 17 === 0
            ? "overtime"
            : (employeeIndex + dayIndex) % 23 === 0
              ? "training"
              : "regular";
        const status: TimeEntryInsert["status"] = dayIndex < 4 ? "submitted" : "approved";
        return {
          org_id: orgId,
          employee_id: employee.id,
          date: isoDate(offset),
          hours: weekend ? 0 : 7.5 + ((employeeIndex + dayIndex) % 3) * 0.5,
          category,
          project: employee.department ?? "Operations",
          status,
        };
      }).filter((entry) => entry.hours > 0)
    );
    await ignoreMissing(supabase.from("time_entries").insert(timeEntries));

    const demoAssetsToInsert: CompanyAssetInsert[] = [
      { org_id: orgId, name: "Demo: MacBook Pro 14", asset_type: "laptop", asset_tag: "DEMO-LAP-001", serial_number: "C02DEMO001", manufacturer: "Apple", model: "MacBook Pro 14 M3", condition: "good", status: "assigned", purchase_date: isoDate(-180), warranty_expires: isoDate(545), purchase_cost: 2499, currency: "USD", location: "Remote - Nigeria", notes: "Assigned to People leadership.", created_by: userId },
      { org_id: orgId, name: "Demo: Dell Latitude 7440", asset_type: "laptop", asset_tag: "DEMO-LAP-002", serial_number: "DL7440DEMO2", manufacturer: "Dell", model: "Latitude 7440", condition: "good", status: "assigned", purchase_date: isoDate(-240), warranty_expires: isoDate(420), purchase_cost: 1550, currency: "USD", location: "London office", notes: "Engineering manager laptop.", created_by: userId },
      { org_id: orgId, name: "Demo: iPhone 15", asset_type: "phone", asset_tag: "DEMO-PHN-001", serial_number: "IP15DEMO01", manufacturer: "Apple", model: "iPhone 15", condition: "new", status: "assigned", purchase_date: isoDate(-35), warranty_expires: isoDate(330), purchase_cost: 899, currency: "USD", location: "Sales team", notes: "Mobile sales device.", created_by: userId },
      { org_id: orgId, name: "Demo: ThinkPad X1 Carbon", asset_type: "laptop", asset_tag: "DEMO-LAP-003", serial_number: "X1DEMO003", manufacturer: "Lenovo", model: "ThinkPad X1 Carbon", condition: "fair", status: "assigned", purchase_date: isoDate(-365), warranty_expires: isoDate(40), purchase_cost: 1390, currency: "USD", location: "Talent team", notes: "Warranty expires soon.", created_by: userId },
      { org_id: orgId, name: "Demo: Dell UltraSharp 27", asset_type: "monitor", asset_tag: "DEMO-MON-001", serial_number: "U27DEMO01", manufacturer: "Dell", model: "UltraSharp 27", condition: "good", status: "available", purchase_date: isoDate(-160), warranty_expires: isoDate(760), purchase_cost: 420, currency: "USD", location: "Lagos office shelf", notes: "Available for new hires.", created_by: userId },
      { org_id: orgId, name: "Demo: YubiKey Security Key", asset_type: "accessory", asset_tag: "DEMO-SEC-001", serial_number: "YUBI-DEMO-1", manufacturer: "Yubico", model: "YubiKey 5C", condition: "good", status: "available", purchase_date: isoDate(-90), warranty_expires: null, purchase_cost: 55, currency: "USD", location: "IT drawer", notes: "Spare MFA key.", created_by: userId },
      { org_id: orgId, name: "Demo: Surface Laptop 5", asset_type: "laptop", asset_tag: "DEMO-LAP-004", serial_number: "SURFDEMO04", manufacturer: "Microsoft", model: "Surface Laptop 5", condition: "repair_needed", status: "repair", purchase_date: isoDate(-430), warranty_expires: isoDate(-20), purchase_cost: 1299, currency: "USD", location: "IT repair shelf", notes: "Keyboard issue reported.", created_by: userId },
    ];
    const insertedAssets = await ignoreMissing(
      supabase
        .from("company_assets")
        .insert(demoAssetsToInsert)
        .select("id, asset_tag, condition")
    );
    if ((insertedAssets ?? []).length) {
      const assetByTag = Object.fromEntries((insertedAssets ?? []).map((asset) => [asset.asset_tag, asset]));
      const assetAssignments: AssetAssignmentInsert[] = [
        ["DEMO-LAP-001", byName["Amina Okafor"].id, isoDate(-120), null, "good", "Demo laptop handover"],
        ["DEMO-LAP-002", byName["Daniel Reed"].id, isoDate(-150), null, "good", "Demo engineering laptop"],
        ["DEMO-PHN-001", byName["Marcus Stanton"].id, isoDate(-30), null, "new", "Demo sales phone"],
        ["DEMO-LAP-003", byName["Sofia Alvarez"].id, isoDate(-210), isoDate(45), "fair", "Demo recruiting laptop"],
      ].flatMap(([assetTag, employeeId, assignedAt, returnDueAt, conditionOut, notes]) => {
        const asset = assetByTag[assetTag as string];
        if (!asset?.id) return [];
        return [{
          org_id: orgId,
          asset_id: asset.id,
          employee_id: employeeId as string,
          assigned_at: assignedAt as string,
          return_due_at: returnDueAt as string | null,
          assignment_status: "assigned" as const,
          condition_out: conditionOut as "new" | "good" | "fair",
          notes: notes as string,
          assigned_by: userId,
        }];
      });
      if (assetAssignments.length) await ignoreMissing(supabase.from("asset_assignments").insert(assetAssignments));
    }

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .insert([
        { org_id: orgId, title: "Demo: Senior Backend Engineer", department: "Engineering", location: "Remote", employment_type: "full_time", status: "open", description: "Own APIs, integrations, and platform scale.", requirements: "Node, Postgres, distributed systems.", created_by: userId },
        { org_id: orgId, title: "Demo: People Operations Partner", department: "People", location: "Lagos", employment_type: "full_time", status: "open", description: "Support HR operations across onboarding, leave, and policy workflows.", requirements: "HRIS, compliance, employee relations.", created_by: userId },
        { org_id: orgId, title: "Demo: Product Marketing Manager", department: "Marketing", location: "New York", employment_type: "full_time", status: "on_hold", description: "Launch new HR analytics and compliance features.", requirements: "B2B SaaS, positioning, GTM.", created_by: userId },
      ])
      .select("id, title");
    if (jobsError) throw new Error(jobsError.message);

    const backendJob = jobs?.find((job) => job.title.includes("Backend"))?.id;
    const peopleJob = jobs?.find((job) => job.title.includes("People"))?.id;
    const marketingJob = jobs?.find((job) => job.title.includes("Marketing"))?.id;
    if (!backendJob || !peopleJob || !marketingJob) throw new Error("Demo jobs could not be created.");

    await ignoreMissing(
      supabase.from("job_applications").insert([
        { job_id: backendJob, candidate_name: "Ada Peterson", candidate_email: "ada.peterson@example.com", stage: "interview", notes: "Strong systems background.", applied_at: isoDateTime(-8) },
        { job_id: backendJob, candidate_name: "Kwame Boateng", candidate_email: "kwame.boateng@example.com", stage: "screening", notes: "Good API portfolio.", applied_at: isoDateTime(-5) },
        { job_id: backendJob, candidate_name: "Isha Mehta", candidate_email: "isha.mehta@example.com", stage: "offer", notes: "Final compensation review.", applied_at: isoDateTime(-16) },
        { job_id: peopleJob, candidate_name: "Tara Williams", candidate_email: "tara.williams@example.com", stage: "applied", notes: "People operations generalist.", applied_at: isoDateTime(-2) },
        { job_id: peopleJob, candidate_name: "Hassan Yusuf", candidate_email: "hassan.yusuf@example.com", stage: "hired", notes: "Accepted offer.", applied_at: isoDateTime(-22) },
        { job_id: marketingJob, candidate_name: "Rachel Stone", candidate_email: "rachel.stone@example.com", stage: "rejected", notes: "Role paused.", applied_at: isoDateTime(-12) },
      ])
    );

    await ignoreMissing(
      supabase.from("job_referrals").insert([
        { org_id: orgId, job_id: backendJob, referrer_id: byName["Noah Chen"].id, candidate_name: "Victor Lee", candidate_email: "victor.lee@example.com", relationship: "Former colleague", cover_note: "Built two payments systems together.", status: "interviewing" },
        { org_id: orgId, job_id: peopleJob, referrer_id: byName["Amina Okafor"].id, candidate_name: "Maya Brown", candidate_email: "maya.brown@example.com", relationship: "HR community", cover_note: "Strong employee relations background.", status: "reviewing" },
      ])
    );

    const { data: payrollRuns, error: payrollError } = await supabase
      .from("payroll_runs")
      .insert([
        { org_id: orgId, name: "Demo: April 2026 Payroll", pay_period_start: monthDate(-1, 1), pay_period_end: monthDate(-1, 30), run_date: monthDate(-1, 28), status: "paid", total_gross: 92000, total_net: 71600, currency: "USD", created_by: userId },
        { org_id: orgId, name: "Demo: May 2026 Payroll", pay_period_start: monthDate(0, 1), pay_period_end: monthDate(0, 31), run_date: isoDate(4), status: "processing", total_gross: 96000, total_net: 74850, currency: "USD", created_by: userId },
      ])
      .select("id, name");
    if (payrollError) throw new Error(payrollError.message);
    const currentRun = payrollRuns?.find((run) => run.name.includes("May"))?.id;
    if (!currentRun) throw new Error("Demo payroll run could not be created.");
    await ignoreMissing(
      supabase.from("payroll_entries").insert(
        activeEmployees.slice(0, 9).map((employee) => ({
          run_id: currentRun,
          employee_id: employee.id,
          gross_pay: Math.round((employee.salary ?? 84000) / 12),
          deductions: Math.round((employee.salary ?? 84000) / 12 * 0.22),
          net_pay: Math.round((employee.salary ?? 84000) / 12 * 0.78),
          notes: "Demo monthly payroll entry",
        }))
      )
    );

    const { data: cycles, error: cycleError } = await supabase
      .from("performance_cycles")
      .insert([
        { org_id: orgId, name: "Demo: H1 2026 Performance Review", type: "mid_year", status: "active", start_date: isoDate(-14), end_date: isoDate(21), created_by: userId },
      ])
      .select("id");
    if (cycleError) throw new Error(cycleError.message);
    await ignoreMissing(
      supabase.from("performance_reviews").insert(
        activeEmployees.slice(0, 9).map((employee, index) => ({
          cycle_id: cycles?.[0]?.id,
          employee_id: employee.id,
          reviewer_id: index % 2 === 0 ? byName["Amina Okafor"].id : byName["Daniel Reed"].id,
          status: index < 4 ? "submitted" : index < 7 ? "in_progress" : "pending",
          rating: index < 4 ? 3 + (index % 3) : null,
          summary: "Demo review summary for calibration and dashboard analytics.",
          strengths: "Ownership, collaboration, and consistent execution.",
          areas_for_improvement: "Prioritisation and cross-functional documentation.",
        }))
      )
    );

    const { data: surveys, error: surveyError } = await supabase
      .from("surveys")
      .insert([
        { org_id: orgId, title: "Demo: May Employee Pulse", type: "pulse", status: "active", questions: [{ id: "q1", text: "How supported do you feel this month?", type: "rating" }, { id: "q2", text: "What would improve your week?", type: "text" }], ends_at: isoDateTime(10), created_by: userId },
        { org_id: orgId, title: "Demo: eNPS Baseline", type: "enps", status: "closed", questions: [{ id: "nps", text: "How likely are you to recommend Atlas as a workplace?", type: "rating" }], ends_at: isoDateTime(-20), created_by: userId },
      ])
      .select("id, title");
    if (surveyError) throw new Error(surveyError.message);
    const pulseSurvey = surveys?.find((survey) => survey.title.includes("Pulse"))?.id;
    if (!pulseSurvey) throw new Error("Demo survey could not be created.");
    await ignoreMissing(
      supabase.from("survey_responses").insert(
        activeEmployees.slice(0, 7).map((employee, index) => ({
          survey_id: pulseSurvey,
          respondent_id: employee.id,
          responses: { q1: 7 + (index % 3), q2: index % 2 === 0 ? "More focus time" : "Clearer priorities" },
          submitted_at: isoDateTime(-index),
        }))
      )
    );

    const benefitPlans = await ignoreMissing(
      supabase
        .from("benefit_plans")
        .insert([
          { org_id: orgId, name: "Demo: Global Health Plan", type: "health", provider: "Wellcare Global", description: "Medical cover for full-time employees.", employer_contribution: 75, employee_contribution: 25, currency: "USD", status: "active", renewal_date: isoDate(75), created_by: userId },
          { org_id: orgId, name: "Demo: Pension Match", type: "pension", provider: "FutureNest", description: "Employer matched retirement contribution.", employer_contribution: 5, employee_contribution: 5, currency: "USD", status: "active", renewal_date: isoDate(120), created_by: userId },
          { org_id: orgId, name: "Demo: Dental Plus", type: "dental", provider: "SmileCare", description: "Optional dental coverage.", employer_contribution: 60, employee_contribution: 40, currency: "USD", status: "active", renewal_date: isoDate(160), created_by: userId },
        ])
        .select("id, name")
    );
    if ((benefitPlans ?? []).length) {
      await ignoreMissing(
        supabase.from("benefit_enrolments").insert(
          activeEmployees.slice(0, 8).flatMap((employee, index) =>
            (benefitPlans ?? []).slice(0, index % 3 === 0 ? 3 : 2).map((plan) => ({
              org_id: orgId,
              plan_id: plan.id,
              employee_id: employee.id,
              status: index % 5 === 0 ? "pending" : "active",
              start_date: isoDate(-120 + index),
              notes: "Demo benefit enrolment",
            }))
          )
        )
      );
    }

    const courses = await ignoreMissing(
      supabase
        .from("lms_courses")
        .insert([
          { org_id: orgId, title: "Demo: Data Privacy Essentials", description: "Privacy handling for HR and managers.", category: "compliance", format: "video", duration_mins: 45, is_mandatory: true, status: "published", created_by: userId },
          { org_id: orgId, title: "Demo: Manager Feedback Lab", description: "Practical feedback and coaching scenarios.", category: "leadership", format: "live", duration_mins: 90, is_mandatory: false, status: "published", created_by: userId },
          { org_id: orgId, title: "Demo: Product Onboarding", description: "New hire enablement for product teams.", category: "onboarding", format: "document", duration_mins: 35, is_mandatory: true, status: "published", created_by: userId },
        ])
        .select("id, title")
    );
    if ((courses ?? []).length) {
      await ignoreMissing(
        supabase.from("lms_enrolments").insert(
          activeEmployees.slice(0, 8).flatMap((employee, employeeIndex) =>
            (courses ?? []).map((course, courseIndex) => {
              const progress = (employeeIndex * 23 + courseIndex * 18) % 101;
              return {
                org_id: orgId,
                course_id: course.id,
                employee_id: employee.id,
                status: progress === 100 ? "completed" : progress > 30 ? "in_progress" : "enrolled",
                progress_pct: progress,
                score: progress === 100 ? 82 + (employeeIndex % 12) : null,
                due_date: isoDate(14 + courseIndex * 10),
                started_at: progress > 0 ? isoDateTime(-8) : null,
                completed_at: progress === 100 ? isoDateTime(-2) : null,
                notes: "Demo learning assignment",
              };
            })
          )
        )
      );
      await ignoreMissing(
        supabase.from("lms_certifications").insert([
          { org_id: orgId, employee_id: byName["Fatima Bello"].id, course_id: courses?.[0]?.id, name: "Data Privacy Essentials", issuer: "Atlas Academy", issued_date: isoDate(-60), expiry_date: isoDate(305) },
          { org_id: orgId, employee_id: byName["Daniel Reed"].id, course_id: courses?.[1]?.id, name: "Manager Feedback Lab", issuer: "Atlas Academy", issued_date: isoDate(-20), expiry_date: isoDate(345) },
        ])
      );
    }

    await ignoreMissing(
      supabase.from("disciplinary_cases").insert([
        { org_id: orgId, employee_id: byName["Ethan Brooks"].id, type: "warning", severity: "moderate", title: "Demo: Attendance warning", description: "Repeated missed check-ins during Q2.", incident_date: isoDate(-35), status: "closed", outcome: "Written warning issued with follow-up plan.", resolved_at: isoDateTime(-18), created_by: userId },
        { org_id: orgId, employee_id: byName["Oliver Hart"].id, type: "query", severity: "minor", title: "Demo: Timesheet clarification", description: "Clarify project allocation across two clients.", incident_date: isoDate(-6), status: "under_review", created_by: userId },
      ])
    );

    const exitRecords = await ignoreMissing(
      supabase
        .from("exit_records")
        .insert([
          { org_id: orgId, employee_id: byName["Ethan Brooks"].id, reason: "resignation", status: "in_progress", last_working_day: isoDate(12), exit_date: isoDate(12), exit_interview_date: isoDate(8), exit_interview_notes: "Demo exit record with open checklist.", initiated_by: userId },
        ])
        .select("id")
    );
    if (exitRecords?.[0]?.id) {
      await ignoreMissing(
        supabase.from("exit_checklist_items").insert([
          { org_id: orgId, exit_id: exitRecords[0].id, category: "equipment", title: "Collect laptop and badge", status: "pending", due_date: isoDate(10) },
          { org_id: orgId, exit_id: exitRecords[0].id, category: "access", title: "Revoke SaaS access", status: "in_progress", due_date: isoDate(12) },
          { org_id: orgId, exit_id: exitRecords[0].id, category: "finance", title: "Prepare final settlement", status: "pending", due_date: isoDate(14) },
        ])
      );
    }

    await ignoreMissing(
      supabase.from("succession_candidates").insert([
        { org_id: orgId, employee_id: byName["Priya Nair"].id, target_role: "Head of Product Design", readiness: "ready_1_year", potential: "high", performance: "exceeds", development_areas: "Commercial strategy and team planning", notes: "Strong candidate for design leadership.", status: "active", nominated_by: userId },
        { org_id: orgId, employee_id: byName["Noah Chen"].id, target_role: "Engineering Manager", readiness: "ready_2_plus", potential: "high", performance: "meets", development_areas: "People management practice", notes: "Pair with Daniel for mentorship.", status: "active", nominated_by: userId },
        { org_id: orgId, employee_id: byName["Grace Mensah"].id, target_role: "Director of Customer Success", readiness: "ready_1_year", potential: "medium", performance: "exceeds", development_areas: "Forecasting and enterprise account strategy", notes: "High trust with customers.", status: "active", nominated_by: userId },
      ])
    );

    await ignoreMissing(
      supabase.from("policy_library").insert([
        { org_id: orgId, title: "Demo: Remote Work Policy", description: "Hybrid work expectations, equipment, security, and availability.", category: "workplace", file_url: "https://example.com/demo/remote-work-policy.pdf", created_by: userId },
        { org_id: orgId, title: "Demo: Anti-Harassment Policy", description: "Reporting routes, investigation principles, and protection from retaliation.", category: "conduct", file_url: "https://example.com/demo/anti-harassment-policy.pdf", created_by: userId },
        { org_id: orgId, title: "Demo: Travel and Expense Policy", description: "Approvals, receipts, reimbursement windows, and spend thresholds.", category: "finance", file_url: "https://example.com/demo/travel-expense-policy.pdf", created_by: userId },
      ])
    );

    await ignoreMissing(
      supabase.from("org_integrations").insert([
        { org_id: orgId, integration_id: "slack", integration_type: "connector", config: { workspace: "Atlas Demo", channels: "#people-ops, #announcements" }, is_active: true, connected_by: userId },
        { org_id: orgId, integration_id: "google-workspace", integration_type: "connector", config: { domain: "atlas-demo.example", sync: "calendar" }, is_active: true, connected_by: userId },
        { org_id: orgId, integration_id: "greenhouse", integration_type: "connector", config: { sync: "candidates" }, is_active: false, connected_by: userId },
      ])
    );
    await ignoreMissing(
      supabase.from("org_enabled_skills").insert([
        { org_id: orgId, skill_id: "leave-risk-brief", enabled_by: userId },
        { org_id: orgId, skill_id: "payroll-explain", enabled_by: userId },
        { org_id: orgId, skill_id: "candidate-screen", enabled_by: userId },
        { org_id: orgId, skill_id: "policy-gap-check", enabled_by: userId },
      ])
    );

    await supabase.from("generated_documents").insert([
      {
        user_id: userId,
        tool_slug: "offer-letter",
        tool_name: "Offer Letter Generator",
        inputs: { role: "Senior Backend Engineer", location: "Remote", salary: "USD 126,000" },
        title: `${DEMO_DOC_PREFIX}: Senior Backend Engineer Offer`,
        output: "Dear Isha, we are pleased to offer you the role of Senior Backend Engineer. This demo document shows how generated HR documents appear in the dashboard and document library.",
      },
      {
        user_id: userId,
        tool_slug: "performance-improvement-plan-pip",
        tool_name: "Performance Improvement Plan",
        inputs: { employee: "Demo Employee", focus: "Attendance and communication" },
        title: `${DEMO_DOC_PREFIX}: Attendance Improvement Plan`,
        output: "This demo PIP outlines expectations, support, milestones, and review dates for an attendance improvement case.",
      },
      {
        user_id: userId,
        tool_slug: "job-description",
        tool_name: "Job Description Generator",
        inputs: { role: "People Operations Partner" },
        title: `${DEMO_DOC_PREFIX}: People Operations Partner JD`,
        output: "This demo job description covers responsibilities, requirements, success measures, and interview criteria for a people operations role.",
      },
    ]);

    await supabase.from("notifications").insert([
      { user_id: userId, type: "leave", title: "Demo: Leave request waiting", body: "Priya Nair requested personal leave.", link: "/org/leave", is_read: false },
      { user_id: userId, type: "payroll", title: "Demo: Payroll in processing", body: "May 2026 payroll is ready for final review.", link: "/payroll", is_read: false },
      { user_id: userId, type: "survey", title: "Demo: Pulse survey live", body: "Seven responses have been submitted.", link: "/surveys", is_read: true },
    ]);

    revalidatePath("/", "layout");

    return {
      success: true,
      summary: [
        `${employees.length} employees`,
        "leave, attendance, payroll, benefits, learning, performance, surveys",
        "jobs, candidates, referrals, succession, exits, assets, documents, integrations",
      ],
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Demo seed failed.",
    };
  }
}
