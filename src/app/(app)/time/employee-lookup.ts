import type { createClient } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/org/get-current-org";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type TimeEmployee = {
  id: string;
  full_name: string;
};

type AuthUser = {
  id: string;
  email?: string | null;
};

export async function getTimeEmployeeForUser(
  supabase: SupabaseServerClient,
  orgCtx: Pick<OrgContext, "org" | "isAdmin">,
  user: AuthUser
): Promise<TimeEmployee | null> {
  const select = "id, full_name";

  const { data: linkedEmployee } = await supabase
    .from("employees")
    .select(select)
    .eq("linked_user_id", user.id)
    .eq("org_id", orgCtx.org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (linkedEmployee) return linkedEmployee;

  if (user.email) {
    const { data: emailEmployee } = await supabase
      .from("employees")
      .select(select)
      .eq("email", user.email)
      .eq("org_id", orgCtx.org.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (emailEmployee) return emailEmployee;
  }

  if (!orgCtx.isAdmin) return null;

  const { data: firstActiveEmployee } = await supabase
    .from("employees")
    .select(select)
    .eq("org_id", orgCtx.org.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return firstActiveEmployee ?? null;
}
