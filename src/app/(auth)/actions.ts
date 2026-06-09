"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { normalizeRoles } from "@/lib/auth/permissions";

function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function signInWithPassword(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const companyName = ((formData.get("company_name") as string) ?? "").trim();
  const companySlug = ((formData.get("company_slug") as string) ?? "").trim();
  const industry = ((formData.get("industry") as string) ?? "").trim() || null;
  const companySize = ((formData.get("company_size") as string) ?? "").trim() || null;
  const role = ((formData.get("role") as string) ?? "").trim() || null;
  const inviteToken = ((formData.get("invite_token") as string) ?? "").trim();
  let goals: string[] = [];
  try {
    const rawGoals = formData.get("goals") as string | null;
    if (rawGoals) goals = JSON.parse(rawGoals);
  } catch {
    goals = [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Sign up failed. Please try again." };
  }

  const admin = createServiceClient();

  // Persist the onboarding answers onto the user's profile. The profile row is
  // created by a DB trigger on signup, so we upsert to update it in place.
  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      industry,
      company_size: companySize,
      goals,
      job_title: role,
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );

  // Invited sign-ups join the existing organisation and skip workspace setup
  // entirely — they never get asked to "set up an organisation".
  if (inviteToken) {
    const { data: invite } = await admin
      .from("org_invites")
      .select("id, org_id, email, roles, expires_at, accepted_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (
      invite &&
      !invite.accepted_at &&
      new Date(invite.expires_at) > new Date() &&
      invite.email.toLowerCase() === email.toLowerCase()
    ) {
      const { data: existing } = await admin
        .from("org_members")
        .select("id")
        .eq("org_id", invite.org_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await admin
          .from("org_members")
          .insert({ org_id: invite.org_id, user_id: userId, roles: normalizeRoles(invite.roles) });
      }

      await admin
        .from("org_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      // Link any pre-created employee record for this email to the new user.
      await admin
        .from("employees")
        .update({ linked_user_id: userId })
        .eq("org_id", invite.org_id)
        .ilike("email", email);
    }

    return { success: true, needsVerification: !data.session };
  }

  // Create the organisation + owner membership during signup so the user never
  // lands on the dashboard being asked to "set up an organisation" again.
  if (companyName && companySlug) {
    let slug = companySlug;
    let org: { id: string } | null = null;

    // If the slug is taken, retry with a short numeric suffix so signup never
    // dead-ends on a duplicate workspace URL.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: created, error: orgError } = await admin
        .from("organisations")
        .insert({ name: companyName, slug, industry, size: companySize, created_by: userId })
        .select("id")
        .single();

      if (!orgError) {
        org = created;
        break;
      }
      if (orgError.code === "23505") {
        slug = `${companySlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        continue;
      }
      return { error: orgError.message };
    }

    if (!org) {
      return { error: "Could not create your workspace. Please try again." };
    }

    const { error: memberError } = await admin
      .from("org_members")
      .insert({ org_id: org.id, user_id: userId, org_role: "admin", roles: ["workspace_owner"] });

    if (memberError) {
      return { error: memberError.message };
    }
  }

  // When email confirmation is enabled, signUp returns no session — the user
  // must verify before they can enter the app.
  return { success: true, needsVerification: !data.session };
}

export async function signInWithOAuth(
  provider: "google" | "github" | "linkedin_oidc"
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function sendPasswordResetEmail(
  _prevState: { error: string } | { success: boolean } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/sign-in?reset=success");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
