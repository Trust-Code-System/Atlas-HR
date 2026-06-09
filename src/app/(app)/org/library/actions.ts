"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { ingestDocument, deleteKbDocumentBySource } from "@/lib/ai/kb/ingest";
import { revalidatePath } from "next/cache";

export type LibraryActionResult =
  | { error?: string; success?: boolean; id?: string; warning?: string }
  | null;

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB — matches the policy-docs bucket limit

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
  const bodyText = ((formData.get("body_text") as string) || "").trim();
  const file = formData.get("file") as File | null;
  const hasFile = file && typeof file.size === "number" && file.size > 0;

  if (!title?.trim()) return { error: "Title is required." };
  if (hasFile && file.size > MAX_UPLOAD_BYTES) {
    return { error: "File is too large (max 20 MB)." };
  }

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

  // Index the policy for AI retrieval (RAG). Best-effort — a parse failure must
  // not lose the saved policy; we surface a warning instead.
  let warning: string | undefined;
  if (hasFile || bodyText) {
    try {
      let buffer: Buffer | undefined;
      let fileName: string | null = null;
      let mediaType: string | null = null;

      if (hasFile) {
        buffer = Buffer.from(await file.arrayBuffer());
        fileName = file.name;
        mediaType = file.type || null;
        // Store the original file (private bucket) for future viewing/re-index.
        try {
          const admin = createAdminClient();
          await admin.storage
            .from("policy-docs")
            .upload(`${orgCtx.org.id}/${item.id}/${file.name}`, buffer, {
              contentType: mediaType ?? "application/octet-stream",
              upsert: true,
            });
        } catch {
          // Non-fatal — indexing still proceeds from the in-memory buffer.
        }
      }

      const result = await ingestDocument({
        orgId: orgCtx.org.id,
        title: title.trim(),
        category,
        source: "policy_library",
        sourceId: item.id,
        buffer,
        mediaType,
        fileName,
        text: bodyText || undefined,
        byteSize: hasFile ? file.size : bodyText.length,
        createdBy: user?.id ?? null,
      });

      if (result.status === "failed") {
        warning = `Policy saved, but AI indexing failed: ${result.error ?? "unknown error"}.`;
      }
    } catch (err) {
      warning = `Policy saved, but AI indexing failed: ${err instanceof Error ? err.message : "unknown error"}.`;
    }
  }

  revalidatePath("/org/library");
  return { success: true, id: item.id, warning };
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

/**
 * §28 privacy control — toggle whether this policy's indexed content may be used
 * in AI answers. Flips the ai_enabled flag on the matching kb_documents row.
 */
export async function toggleAiEnabled(
  policyId: string,
  enabled: boolean
): Promise<LibraryActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("kb_documents")
    .update({ ai_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("org_id", orgCtx.org.id)
    .eq("source", "policy_library")
    .eq("source_id", policyId);

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

  // Remove the indexed knowledge-base document + chunks (FK cascade).
  try {
    await deleteKbDocumentBySource(orgCtx.org.id, "policy_library", itemId);
  } catch {
    // Non-fatal — the policy row is already gone.
  }

  revalidatePath("/org/library");
  return { success: true };
}
