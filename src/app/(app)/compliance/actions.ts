"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import {
  getAllComplianceUpdates,
  saveAllComplianceUpdates,
  type ComplianceUpdate,
} from "@/lib/compliance-data";

type ActionResult = { success?: boolean; error?: string };

async function requireAdmin(): Promise<{ user: Awaited<ReturnType<typeof getUser>>; error?: string }> {
  const user = await getUser();
  if (!user) return { user: null, error: "Not authenticated" };
  if (!["admin", "moderator"].includes(user.role)) return { user, error: "Not authorised" };
  return { user };
}

export async function updateComplianceStatus(
  id: string,
  adminStatus: ComplianceUpdate["adminStatus"]
): Promise<ActionResult> {
  const { error } = await requireAdmin();
  if (error) return { error };

  const updates = getAllComplianceUpdates();
  const idx = updates.findIndex((u) => u.id === id);
  if (idx === -1) return { error: "Update not found" };

  updates[idx] = {
    ...updates[idx],
    adminStatus,
    ...(adminStatus === "published" ? { publishedAt: new Date().toISOString().slice(0, 10) } : {}),
  };

  saveAllComplianceUpdates(updates);
  revalidatePath("/compliance-updates");
  revalidatePath("/compliance");
  return { success: true };
}

export async function createComplianceUpdate(
  data: Omit<ComplianceUpdate, "adminStatus" | "publishedAt" | "publishedBy">
): Promise<ActionResult> {
  const { user, error } = await requireAdmin();
  if (error) return { error };

  const updates = getAllComplianceUpdates();
  if (updates.some((u) => u.id === data.id)) {
    return { error: "An update with this ID already exists." };
  }

  updates.unshift({
    ...data,
    adminStatus: "draft",
    publishedAt: "",
    publishedBy: user?.full_name ?? user?.email ?? "Admin",
  });

  saveAllComplianceUpdates(updates);
  revalidatePath("/compliance");
  return { success: true };
}

export async function deleteComplianceUpdate(id: string): Promise<ActionResult> {
  const { error } = await requireAdmin();
  if (error) return { error };

  const updates = getAllComplianceUpdates().filter((u) => u.id !== id);
  saveAllComplianceUpdates(updates);
  revalidatePath("/compliance-updates");
  revalidatePath("/compliance");
  return { success: true };
}
