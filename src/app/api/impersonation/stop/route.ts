import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getActualUser } from "@/lib/auth/get-user";
import { logAdminAction } from "@/lib/admin/audit";

const COOKIE = "atlas_impersonate";

export async function GET() {
  const jar = await cookies();
  const impersonatedUserId = jar.get(COOKIE)?.value ?? null;
  jar.delete(COOKIE);

  const admin = await getActualUser();
  if (admin?.role === "admin" && impersonatedUserId) {
    await logAdminAction({
      adminUserId: admin.id,
      action: "impersonation_stopped",
      targetUserId: impersonatedUserId,
      targetResource: "profile",
      targetResourceId: impersonatedUserId,
    });
  }

  redirect("/admin/users");
}
