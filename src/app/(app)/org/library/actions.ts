"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type LibraryActionResult = { error?: string; success?: boolean; id?: string } | null;

export async function createPolicyDocument(
  _prev: LibraryActionResult,
  formData: FormData
): Promise<LibraryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const category = (formData.get("category") as string) || "general";
  const file_url = (formData.get("file_url") as string) || null;
  const is_published = formData.get("is_published") !== "false";

  if (!title?.trim()) return { error: "Title is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: item, error } = await supabase
    .from("policy_library")
    .insert({
      org_id: orgCtx.org.id,
      title: title.trim(),
      description: description?.trim() || null,
      category,
      file_url: file_url?.trim() || null,
      is_published,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !item) return { error: error?.message ?? "Failed to create document." };

  revalidatePath("/org/library");
  return { success: true, id: item.id };
}

export async function togglePublished(
  itemId: string,
  published: boolean
): Promise<LibraryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("policy_library")
    .select("id")
    .eq("id", itemId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!item) return { error: "Document not found." };

  const { error } = await supabase
    .from("policy_library")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/org/library");
  return { success: true };
}

export async function deletePolicyDocument(itemId: string): Promise<LibraryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("policy_library")
    .select("id")
    .eq("id", itemId)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!item) return { error: "Document not found." };

  const { error } = await supabase.from("policy_library").delete().eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/org/library");
  return { success: true };
}
