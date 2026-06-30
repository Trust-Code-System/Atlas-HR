"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

export type RecruitingActionResult = { error?: string; success?: boolean; id?: string } | null;
type JobApplicationInsert = Database["public"]["Tables"]["job_applications"]["Insert"];

function revalidateRecruitingViews(jobId?: string) {
  revalidatePath("/recruiting");
  if (jobId) revalidatePath(`/recruiting/${jobId}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

function revalidateHiringConversionViews(jobId: string) {
  revalidateRecruitingViews(jobId);
  revalidatePath("/org/people");
  revalidatePath("/org/chart");
  revalidatePath("/manager");
}

export async function createJob(
  _prev: RecruitingActionResult,
  formData: FormData
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const title = formData.get("title") as string;
  const department = (formData.get("department") as string) || null;
  const location = (formData.get("location") as string) || null;
  const employment_type = (formData.get("employment_type") as string) || "full_time";
  const description = (formData.get("description") as string) || null;
  const requirements = (formData.get("requirements") as string) || null;
  const status = (formData.get("status") as string) || "open";

  if (!title?.trim()) return { error: "Job title is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      org_id: orgCtx.org.id,
      title: title.trim(),
      department: department?.trim() || null,
      location: location?.trim() || null,
      employment_type,
      description: description?.trim() || null,
      requirements: requirements?.trim() || null,
      status: status as "draft" | "open" | "closed" | "on_hold",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !job) return { error: error?.message ?? "Failed to create job." };

  revalidateRecruitingViews();
  return { success: true, id: job.id };
}

export async function updateJobStatus(
  jobId: string,
  status: "open" | "on_hold" | "closed" | "draft"
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return { error: "Job not found." };

  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) return { error: error.message };

  revalidateRecruitingViews(jobId);
  return { success: true };
}

/** @deprecated use updateJobStatus("closed") */
export async function closeJob(jobId: string): Promise<RecruitingActionResult> {
  return updateJobStatus(jobId, "closed");
}

export async function addApplication(
  _prev: RecruitingActionResult,
  formData: FormData
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const job_id = formData.get("job_id") as string;
  const candidate_name = formData.get("candidate_name") as string;
  const candidate_email = (formData.get("candidate_email") as string) || null;
  const candidate_phone = (formData.get("candidate_phone") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const source = (formData.get("source") as string) || null;
  const linkedin_url = (formData.get("linkedin_url") as string) || null;

  if (!candidate_name?.trim()) return { error: "Candidate name is required." };

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", job_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return { error: "Job not found." };

  const application: JobApplicationInsert = {
    job_id,
    candidate_name: candidate_name.trim(),
    candidate_email: candidate_email?.trim() || null,
    candidate_phone: candidate_phone?.trim() || null,
    notes: notes?.trim() || null,
    source: (source as "linkedin" | "indeed" | "referral" | "careers_page" | "glassdoor" | "agency" | "direct" | "other") || null,
    linkedin_url: linkedin_url?.trim() || null,
    stage: "applied",
  };

  const { error } = await supabase.from("job_applications").insert(application);

  if (error) return { error: error.message };

  revalidateRecruitingViews(job_id);
  return { success: true };
}

export async function updateApplicationNotes(
  applicationId: string,
  notes: string
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("job_applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { error: "Application not found." };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", app.job_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return { error: "Application not found in your organisation." };

  const { error } = await supabase
    .from("job_applications")
    .update({ notes: notes.trim() || null })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidateRecruitingViews(app.job_id);
  return { success: true };
}

export async function moveApplicationStage(
  applicationId: string,
  stage: string
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("job_applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();

  if (!app) return { error: "Application not found." };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", app.job_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return { error: "Application not found in your organisation." };

  const { error } = await supabase
    .from("job_applications")
    .update({ stage: stage as "applied" | "screening" | "interview" | "offer" | "hired" | "rejected" })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidateRecruitingViews(app.job_id);
  return { success: true };
}

export async function convertToEmployee(
  _prev: RecruitingActionResult,
  formData: FormData
): Promise<RecruitingActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const applicationId = formData.get("application_id") as string;
  const startDate = formData.get("start_date") as string;
  const jobTitle = (formData.get("job_title") as string) || null;
  const department = (formData.get("department") as string) || null;
  const salaryStr = (formData.get("salary") as string) || null;
  const salaryParsed = salaryStr ? parseFloat(salaryStr) : null;
  const salary = salaryParsed != null && isFinite(salaryParsed) ? Math.max(0, Math.min(salaryParsed, 100_000_000)) : null;
  const employmentType = (formData.get("employment_type") as string) || "full_time";

  if (!startDate) return { error: "Start date is required." };

  const supabase = await createClient();

  const { data: app } = await supabase
    .from("job_applications")
    .select("id, job_id, candidate_name, candidate_email, candidate_phone, stage")
    .eq("id", applicationId)
    .single();

  if (!app) return { error: "Application not found." };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, org_id")
    .eq("id", app.job_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!job) return { error: "Application not found in your organisation." };

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      org_id: orgCtx.org.id,
      full_name: app.candidate_name,
      email: app.candidate_email,
      phone: app.candidate_phone,
      job_title: jobTitle?.trim() || null,
      department: department?.trim() || null,
      start_date: startDate,
      status: "active",
      employment_type: employmentType as "full_time" | "part_time" | "contract" | "intern",
      salary: salary && !isNaN(salary) ? salary : null,
      salary_currency: "GBP",
    })
    .select("id")
    .single();

  if (error || !employee) return { error: error?.message ?? "Failed to create employee record." };

  revalidateHiringConversionViews(app.job_id);
  return { success: true, id: employee.id };
}
