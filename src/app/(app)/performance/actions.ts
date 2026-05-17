"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type PerfActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function createPerformanceCycle(
  _prev: PerfActionResult,
  formData: FormData
): Promise<PerfActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = formData.get("name") as string;
  const type = (formData.get("type") as string) || "annual";
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;

  if (!name?.trim()) return { error: "Cycle name is required." };
  if (!start_date || !end_date) return { error: "Start and end dates are required." };
  if (new Date(start_date) > new Date(end_date)) return { error: "Start date must be before end date." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cycle, error: cycleErr } = await supabase
    .from("performance_cycles")
    .insert({
      org_id: orgCtx.org.id,
      name: name.trim(),
      type: type as "annual" | "mid_year" | "quarterly" | "custom",
      status: "active",
      start_date,
      end_date,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (cycleErr || !cycle) return { error: cycleErr?.message ?? "Failed to create cycle." };

  // Auto-create pending reviews for all active employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, manager_id")
    .eq("org_id", orgCtx.org.id)
    .eq("status", "active");

  if (employees && employees.length > 0) {
    const reviews = employees.map((e) => ({
      cycle_id: cycle.id,
      employee_id: e.id,
      reviewer_id: e.manager_id ?? null,
      status: "pending" as const,
    }));
    await supabase.from("performance_reviews").insert(reviews);
  }

  revalidatePath("/performance");
  return { success: true, id: cycle.id };
}

export async function updateReview(
  reviewId: string,
  _prev: PerfActionResult,
  formData: FormData
): Promise<PerfActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return { error: "Not authenticated." };

  const supabase = await createClient();

  // Verify the review belongs to this org (two queries — no joins)
  const { data: review } = await supabase
    .from("performance_reviews")
    .select("id, cycle_id")
    .eq("id", reviewId)
    .single();

  if (!review) return { error: "Review not found." };

  const { data: cycle } = await supabase
    .from("performance_cycles")
    .select("id")
    .eq("id", review.cycle_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!cycle) return { error: "Review not found in your organisation." };

  const ratingRaw = formData.get("rating") as string;
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : null;
  const summary = (formData.get("summary") as string) || null;
  const strengths = (formData.get("strengths") as string) || null;
  const areas_for_improvement = (formData.get("areas_for_improvement") as string) || null;

  if (rating !== null && (rating < 1 || rating > 5)) return { error: "Rating must be between 1 and 5." };

  const { error } = await supabase
    .from("performance_reviews")
    .update({
      rating,
      summary: summary?.trim() || null,
      strengths: strengths?.trim() || null,
      areas_for_improvement: areas_for_improvement?.trim() || null,
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  revalidatePath(`/performance/${review.cycle_id}`);
  return { success: true };
}

export async function closeCycle(cycleId: string): Promise<PerfActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("performance_cycles")
    .select("id")
    .eq("id", cycleId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!cycle) return { error: "Cycle not found." };

  const { error } = await supabase
    .from("performance_cycles")
    .update({ status: "completed" })
    .eq("id", cycleId);

  if (error) return { error: error.message };

  revalidatePath("/performance");
  revalidatePath(`/performance/${cycleId}`);
  return { success: true };
}
