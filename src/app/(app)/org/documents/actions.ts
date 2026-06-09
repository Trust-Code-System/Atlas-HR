"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { revalidatePath } from "next/cache";

export type DocActionResult = { error?: string; success?: boolean } | null;

export async function addEmployeeDocument(
  _prev: DocActionResult,
  formData: FormData
): Promise<DocActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const employee_id = formData.get("employee_id") as string;
  const doc_type = formData.get("doc_type") as string;
  const file_name = formData.get("file_name") as string;
  const file_url = formData.get("file_url") as string;
  const expires_at = (formData.get("expires_at") as string) || null;

  if (!employee_id) return { error: "Employee is required." };
  if (!doc_type?.trim()) return { error: "Document type is required." };
  if (!file_name?.trim()) return { error: "File name is required." };
  if (!file_url?.trim()) return { error: "File URL is required." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify employee belongs to org
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return { error: "Employee not found." };

  const { error } = await supabase.from("employee_documents").insert({
    employee_id,
    doc_type: doc_type.trim(),
    file_name: file_name.trim(),
    file_url: file_url.trim(),
    expires_at: expires_at || null,
    uploaded_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/org/documents");
  return { success: true };
}

export async function toggleEmployeeDocAi(docId: string, enabled: boolean): Promise<DocActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  // Verify via employee → org
  const { data: doc } = await supabase
    .from("employee_documents")
    .select("id, employee_id")
    .eq("id", docId)
    .single();
  if (!doc) return { error: "Document not found." };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", doc.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();
  if (!employee) return { error: "Not authorised." };

  const { error } = await supabase
    .from("employee_documents")
    .update({ ai_enabled: enabled })
    .eq("id", docId);

  if (error) return { error: error.message };

  revalidatePath("/org/documents");
  return { success: true };
}

export async function deleteEmployeeDocument(docId: string): Promise<DocActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const supabase = await createClient();

  // Verify via employee → org
  const { data: doc } = await supabase
    .from("employee_documents")
    .select("id, employee_id")
    .eq("id", docId)
    .single();

  if (!doc) return { error: "Document not found." };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", doc.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return { error: "Not authorised." };

  const { error } = await supabase.from("employee_documents").delete().eq("id", docId);

  if (error) return { error: error.message };

  revalidatePath("/org/documents");
  return { success: true };
}
