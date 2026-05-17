"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userHasActiveBetaAccess } from "@/lib/beta";

const schema = z.object({
  category: z.enum(["bug", "feature_request", "content", "general", "onboarding", "copilot", "tools"]),
  severity: z.enum(["low", "normal", "high", "blocker"]),
  page_url: z.string().url().optional().or(z.literal("")),
  body: z.string().min(10).max(5000),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal("none")).or(z.literal("")),
});

type State = { success?: true; error?: string };

function isUpload(file: FormDataEntryValue | null): file is File {
  return typeof File !== "undefined" && file instanceof File && file.size > 0;
}

export async function submitBetaFeedback(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return { error: "Sign in to submit beta feedback." };
  if (!(await userHasActiveBetaAccess(user.id))) {
    return { error: "Beta feedback is only available to active beta users." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Please add enough detail before submitting." };

  let screenshotPath: string | null = null;
  const screenshot = formData.get("screenshot");

  if (isUpload(screenshot)) {
    if (screenshot.size > 5 * 1024 * 1024) {
      return { error: "Attachments must be 5MB or smaller." };
    }

    const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]);
    if (!allowed.has(screenshot.type)) {
      return { error: "Attach an image or PDF only." };
    }

    const ext = screenshot.name.split(".").pop()?.toLowerCase() ?? "bin";
    screenshotPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("beta-feedback")
      .upload(screenshotPath, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      });

    if (uploadError) return { error: uploadError.message };
  }

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    category: parsed.data.category,
    severity: parsed.data.severity,
    page_url: parsed.data.page_url || null,
    body: parsed.data.body,
    rating:
      parsed.data.rating === "" || parsed.data.rating === "none"
        ? null
        : parsed.data.rating ?? null,
    screenshot_url: screenshotPath,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/beta/feedback");
  return { success: true };
}
