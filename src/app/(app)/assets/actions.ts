"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { createClient } from "@/lib/supabase/server";
import type { AssetAssignment, CompanyAsset } from "@/types/database";

export type AssetsActionResult = { error?: string; success?: boolean; id?: string } | null;

type AssetType = CompanyAsset["asset_type"];
type AssetCondition = CompanyAsset["condition"];
type AssetStatus = CompanyAsset["status"];

const ASSET_TYPES = new Set<AssetType>(["laptop", "desktop", "monitor", "phone", "tablet", "accessory", "vehicle", "license", "card", "other"]);
const CONDITIONS = new Set<AssetCondition>(["new", "good", "fair", "damaged", "repair_needed"]);
const STATUSES = new Set<AssetStatus>(["available", "assigned", "repair", "lost", "retired"]);

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalDate(value: FormDataEntryValue | null) {
  const text = optionalText(value);
  return text || null;
}

export async function createAsset(
  _prev: AssetsActionResult,
  formData: FormData,
): Promise<AssetsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const name = optionalText(formData.get("name"));
  if (!name) return { error: "Asset name is required." };

  const assetType = formData.get("asset_type") as AssetType | null;
  const condition = formData.get("condition") as AssetCondition | null;
  const status = formData.get("status") as AssetStatus | null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("company_assets")
    .insert({
      org_id: orgCtx.org.id,
      name,
      asset_type: assetType && ASSET_TYPES.has(assetType) ? assetType : "other",
      asset_tag: optionalText(formData.get("asset_tag")),
      serial_number: optionalText(formData.get("serial_number")),
      manufacturer: optionalText(formData.get("manufacturer")),
      model: optionalText(formData.get("model")),
      condition: condition && CONDITIONS.has(condition) ? condition : "good",
      status: status && STATUSES.has(status) ? status : "available",
      purchase_date: optionalDate(formData.get("purchase_date")),
      warranty_expires: optionalDate(formData.get("warranty_expires")),
      purchase_cost: optionalNumber(formData.get("purchase_cost")),
      currency: optionalText(formData.get("currency")) ?? "USD",
      location: optionalText(formData.get("location")),
      notes: optionalText(formData.get("notes")),
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create asset." };

  revalidatePath("/assets");
  return { success: true, id: data.id };
}

export async function assignAsset(
  _prev: AssetsActionResult,
  formData: FormData,
): Promise<AssetsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const assetId = formData.get("asset_id") as string;
  const employeeId = formData.get("employee_id") as string;
  if (!assetId || !employeeId) return { error: "Asset and employee are required." };

  const conditionOut = formData.get("condition_out") as AssetCondition | null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: asset }, { data: employee }] = await Promise.all([
    supabase.from("company_assets").select("id, status").eq("id", assetId).eq("org_id", orgCtx.org.id).maybeSingle(),
    supabase.from("employees").select("id").eq("id", employeeId).eq("org_id", orgCtx.org.id).maybeSingle(),
  ]);

  if (!asset) return { error: "Asset not found." };
  if (!employee) return { error: "Employee not found." };
  if (asset.status === "assigned") return { error: "This asset is already assigned." };
  if (asset.status === "retired" || asset.status === "lost") return { error: "This asset cannot be assigned." };

  const { data, error } = await supabase
    .from("asset_assignments")
    .insert({
      org_id: orgCtx.org.id,
      asset_id: assetId,
      employee_id: employeeId,
      assigned_at: optionalDate(formData.get("assigned_at")) ?? new Date().toISOString().slice(0, 10),
      return_due_at: optionalDate(formData.get("return_due_at")),
      assignment_status: "assigned",
      condition_out: conditionOut && CONDITIONS.has(conditionOut) ? conditionOut : null,
      notes: optionalText(formData.get("notes")),
      assigned_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to assign asset." };

  const { error: updateError } = await supabase
    .from("company_assets")
    .update({ status: "assigned", updated_at: new Date().toISOString() })
    .eq("id", assetId)
    .eq("org_id", orgCtx.org.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/assets");
  revalidatePath("/org/people");
  return { success: true, id: data.id };
}

export async function returnAsset(
  _prev: AssetsActionResult,
  formData: FormData,
): Promise<AssetsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };

  const assignmentId = formData.get("assignment_id") as string;
  const assetId = formData.get("asset_id") as string;
  const conditionIn = formData.get("condition_in") as AssetCondition | null;
  const statusAfterReturn = formData.get("status_after_return") as AssetStatus | null;
  if (!assignmentId || !assetId) return { error: "Assignment is required." };

  const nextStatus: AssetStatus =
    statusAfterReturn && ["available", "repair", "retired", "lost"].includes(statusAfterReturn)
      ? statusAfterReturn
      : "available";

  const supabase = await createClient();
  const { error } = await supabase
    .from("asset_assignments")
    .update({
      returned_at: new Date().toISOString().slice(0, 10),
      assignment_status: nextStatus === "lost" ? "lost" : "returned",
      condition_in: conditionIn && CONDITIONS.has(conditionIn) ? conditionIn : null,
      notes: optionalText(formData.get("notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("asset_id", assetId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };

  const { error: assetError } = await supabase
    .from("company_assets")
    .update({
      status: nextStatus,
      condition: conditionIn && CONDITIONS.has(conditionIn) ? conditionIn : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("org_id", orgCtx.org.id);

  if (assetError) return { error: assetError.message };

  revalidatePath("/assets");
  revalidatePath("/org/people");
  return { success: true };
}

export async function updateAssetStatus(assetId: string, status: AssetStatus): Promise<AssetsActionResult> {
  const orgCtx = await getCurrentOrg();
  if (!orgCtx?.isAdmin) return { error: "Admin access required." };
  if (!STATUSES.has(status)) return { error: "Invalid asset status." };

  const supabase = await createClient();
  const { data: activeAssignment } = await supabase
    .from("asset_assignments")
    .select("id")
    .eq("asset_id", assetId)
    .eq("org_id", orgCtx.org.id)
    .eq("assignment_status", "assigned")
    .maybeSingle();

  if (activeAssignment && status !== "assigned") {
    return { error: "Return the active assignment before changing this asset status." };
  }

  const { error } = await supabase
    .from("company_assets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", assetId)
    .eq("org_id", orgCtx.org.id);

  if (error) return { error: error.message };
  revalidatePath("/assets");
  return { success: true };
}

export type AssetAssignmentStatus = AssetAssignment["assignment_status"];
