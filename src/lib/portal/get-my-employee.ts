import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import type { Employee } from "@/types/database";

export const getMyEmployee = cache(async (): Promise<Employee | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const orgData = await getCurrentOrg();
  if (!orgData) return null;

  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("linked_user_id", user.id)
    .eq("org_id", orgData.org.id)
    .single();

  return data ?? null;
});
