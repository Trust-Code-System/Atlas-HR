"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type SurveyActionResult = { error?: string; success?: boolean; id?: string } | null;

type SurveyQuestion = {
  id: string;
  text: string;
  type: "rating" | "text" | "nps";
};

export async function createSurvey(
  _prev: SurveyActionResult,
  formData: FormData
): Promise<SurveyActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const title = formData.get("title") as string;
  const type = (formData.get("type") as string) || "pulse";
  const ends_at = (formData.get("ends_at") as string) || null;

  if (!title?.trim()) return { error: "Survey title is required." };

  // Build questions from formData
  const questions: SurveyQuestion[] = [];

  if (type === "enps") {
    questions.push({
      id: "enps_score",
      text: "On a scale of 0-10, how likely are you to recommend this company as a place to work?",
      type: "nps",
    });
    questions.push({
      id: "enps_reason",
      text: "What's the main reason for your score?",
      type: "text",
    });
  } else {
    // Parse dynamic questions from form
    const questionTexts = formData.getAll("question_text") as string[];
    const questionTypes = formData.getAll("question_type") as string[];
    questionTexts.forEach((text, i) => {
      if (text?.trim()) {
        questions.push({
          id: `q_${i + 1}`,
          text: text.trim(),
          type: (questionTypes[i] as "rating" | "text" | "nps") || "text",
        });
      }
    });

    if (questions.length === 0) return { error: "At least one question is required." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: survey, error } = await supabase
    .from("surveys")
    .insert({
      org_id: orgCtx.org.id,
      title: title.trim(),
      type: type as "enps" | "pulse" | "custom",
      status: "active",
      questions,
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !survey) return { error: error?.message ?? "Failed to create survey." };

  revalidatePath("/surveys");
  return { success: true, id: survey.id };
}

export async function closeSurvey(surveyId: string): Promise<SurveyActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id")
    .eq("id", surveyId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!survey) return { error: "Survey not found." };

  const { error } = await supabase
    .from("surveys")
    .update({ status: "closed" })
    .eq("id", surveyId);

  if (error) return { error: error.message };

  revalidatePath("/surveys");
  revalidatePath(`/surveys/${surveyId}`);
  return { success: true };
}
