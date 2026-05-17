"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type LMSActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function createCourse(
  _prev: LMSActionResult,
  formData: FormData,
): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Course title is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("lms_courses")
    .insert({
      org_id: orgCtx.org.id,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      category: ((formData.get("category") as string) || "other") as
        | "compliance" | "technical" | "soft_skills" | "leadership" | "onboarding" | "other",
      format: ((formData.get("format") as string) || "document") as
        | "video" | "document" | "live" | "external" | "scorm",
      duration_mins: parseInt(formData.get("duration_mins") as string) || null,
      external_url: (formData.get("external_url") as string)?.trim() || null,
      is_mandatory: formData.get("is_mandatory") === "true",
      status: "published",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create course." };
  revalidatePath("/learning");
  return { success: true, id: data.id };
}

export async function updateCourse(
  _prev: LMSActionResult,
  formData: FormData,
): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const courseId = formData.get("course_id") as string;
  if (!courseId) return { error: "Course ID required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lms_courses")
    .update({
      title: (formData.get("title") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      category: ((formData.get("category") as string) || "other") as
        | "compliance" | "technical" | "soft_skills" | "leadership" | "onboarding" | "other",
      format: ((formData.get("format") as string) || "document") as
        | "video" | "document" | "live" | "external" | "scorm",
      duration_mins: parseInt(formData.get("duration_mins") as string) || null,
      external_url: (formData.get("external_url") as string)?.trim() || null,
      is_mandatory: formData.get("is_mandatory") === "true",
      status: ((formData.get("status") as string) || "published") as
        | "draft" | "published" | "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/learning");
  return { success: true };
}

export async function deleteCourse(courseId: string): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lms_courses")
    .delete()
    .eq("id", courseId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/learning");
  return { success: true };
}

export async function enrolEmployees(
  _prev: LMSActionResult,
  formData: FormData,
): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const course_id = formData.get("course_id") as string;
  const employee_id = formData.get("employee_id") as string;
  if (!course_id || !employee_id) return { error: "Course and employee are required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lms_enrolments")
    .upsert(
      {
        org_id: orgCtx.org.id,
        course_id,
        employee_id,
        status: "enrolled",
        progress_pct: 0,
        due_date: (formData.get("due_date") as string) || null,
      },
      { onConflict: "course_id,employee_id" },
    );

  if (error) return { error: error.message };
  revalidatePath("/learning");
  return { success: true };
}

export async function updateEnrolmentProgress(
  enrolmentId: string,
  progress_pct: number,
  status: "enrolled" | "in_progress" | "completed" | "failed" | "dropped",
): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lms_enrolments")
    .update({
      progress_pct,
      status,
      started_at: status !== "enrolled" ? new Date().toISOString() : null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrolmentId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/learning");
  return { success: true };
}

export async function addCertification(
  _prev: LMSActionResult,
  formData: FormData,
): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const employee_id = formData.get("employee_id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!employee_id || !name) return { error: "Employee and certification name are required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lms_certifications")
    .insert({
      org_id: orgCtx.org.id,
      employee_id,
      course_id: (formData.get("course_id") as string) || null,
      name,
      issuer: (formData.get("issuer") as string)?.trim() || null,
      issued_date: (formData.get("issued_date") as string) || null,
      expiry_date: (formData.get("expiry_date") as string) || null,
      credential_url: (formData.get("credential_url") as string)?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to add certification." };
  revalidatePath("/learning");
  return { success: true, id: data.id };
}

export async function deleteCertification(certId: string): Promise<LMSActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lms_certifications")
    .delete()
    .eq("id", certId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/learning");
  return { success: true };
}
