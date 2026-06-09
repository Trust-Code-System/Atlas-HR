import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import type { Profile } from "@/types/database";

export const getActualUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Fill missing display fields from Supabase auth metadata (OAuth logins, etc.)
  const meta = user.user_metadata ?? {};
  return {
    ...profile,
    full_name: profile.full_name || (meta.full_name as string | undefined) || (meta.name as string | undefined) || null,
    avatar_url: profile.avatar_url || (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null,
  };
});

export async function getUser(): Promise<Profile | null> {
  const profile = await getActualUser();
  if (!profile) return null;

  // Admins can impersonate another user in read-only mode.
  if (profile.role === "admin") {
    const jar = await cookies();
    const impersonatedId = jar.get("atlas_impersonate")?.value;
    if (impersonatedId && impersonatedId !== profile.id) {
      const supabase = await createClient();

      // Verify the admin shares an org with the impersonated user AND has admin rights there
      const { data: adminOrgs } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", profile.id)
        .eq("org_role", "admin");

      const adminOrgIds = (adminOrgs ?? []).map((o) => o.org_id);

      if (adminOrgIds.length > 0) {
        const { data: sharedMembership } = await supabase
          .from("org_members")
          .select("id")
          .eq("user_id", impersonatedId)
          .in("org_id", adminOrgIds)
          .limit(1)
          .single();

        if (sharedMembership) {
          const { data: impersonated } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", impersonatedId)
            .single();
          if (impersonated) return impersonated;
        }
      }
    }
  }

  return profile;
}
