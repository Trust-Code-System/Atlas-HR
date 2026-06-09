"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type ComplaintUpdate = Database["public"]["Tables"]["complaints"]["Update"];

export type ComplaintActionResult = { error?: string; success?: boolean; id?: string } | null;

const CATEGORIES = ["harassment", "discrimination", "bullying", "safety", "pay", "management", "policy", "interpersonal", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["new", "triaging", "investigating", "resolved", "dismissed", "closed"];

export async function fileComplaint(
  _prev: ComplaintActionResult,
  formData: FormData
): Promise<ComplaintActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "You must be signed in." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  if (!title) return { error: "A short title is required." };
  if (!description || description.length < 10) return { error: "Please describe what happened (at least a sentence)." };

  const category = (formData.get("category") as string) || "other";
  const severity = (formData.get("severity") as string) || "medium";
  const is_sensitive = formData.get("is_sensitive") === "true";
  const is_anonymous = formData.get("is_anonymous") === "true";
  const subject_employee_id = (formData.get("subject_employee_id") as string) || null;
  const ai_summary = ((formData.get("ai_summary") as string) || "").trim() || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Best-effort link to the reporter's employee record (kept even if anonymous;
  // never surfaced to handlers when anonymous).
  let reporter_employee_id: string | null = null;
  const { data: meByUser } = await supabase
    .from("employees").select("id").eq("org_id", orgCtx.org.id).eq("linked_user_id", user.id).limit(1).maybeSingle();
  reporter_employee_id = meByUser?.id ?? null;
  if (!reporter_employee_id && user.email) {
    const { data: meByEmail } = await supabase
      .from("employees").select("id").eq("org_id", orgCtx.org.id).eq("email", user.email).limit(1).maybeSingle();
    reporter_employee_id = meByEmail?.id ?? null;
  }

  // Validate subject employee belongs to org.
  let subjectId: string | null = null;
  if (subject_employee_id) {
    const { data: subj } = await supabase
      .from("employees").select("id").eq("id", subject_employee_id).eq("org_id", orgCtx.org.id).maybeSingle();
    subjectId = subj?.id ?? null;
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      org_id: orgCtx.org.id,
      reporter_user_id: user.id,
      reporter_employee_id,
      is_anonymous,
      subject_employee_id: subjectId,
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      category: CATEGORIES.includes(category) ? category : "other",
      severity: SEVERITIES.includes(severity) ? severity : "medium",
      is_sensitive,
      ai_summary,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to submit." };

  revalidatePath("/complaints");
  return { success: true, id: data.id };
}

export interface ComplaintPatch {
  status?: string;
  category?: string;
  severity?: string;
  is_sensitive?: boolean;
  assigned_to?: string | null;
  resolution?: string | null;
}

export async function updateComplaint(id: string, patch: ComplaintPatch): Promise<ComplaintActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Unauthorized" };

  const supabase = await createClient();

  const update: ComplaintUpdate = { updated_at: new Date().toISOString() };
  if (patch.status && STATUSES.includes(patch.status)) {
    update.status = patch.status;
    update.resolved_at = patch.status === "resolved" || patch.status === "closed" || patch.status === "dismissed"
      ? new Date().toISOString()
      : null;
  }
  if (patch.category && CATEGORIES.includes(patch.category)) update.category = patch.category;
  if (patch.severity && SEVERITIES.includes(patch.severity)) update.severity = patch.severity;
  if (typeof patch.is_sensitive === "boolean") update.is_sensitive = patch.is_sensitive;
  if (patch.assigned_to !== undefined) update.assigned_to = patch.assigned_to;
  if (patch.resolution !== undefined) update.resolution = patch.resolution?.trim() || null;

  // RLS enforces who may update (assigned handler / HR admin / workspace owner).
  const { error } = await supabase
    .from("complaints")
    .update(update)
    .eq("id", id)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/complaints");
  return { success: true };
}
