import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    // Verify the caller is authenticated (uses cookie-based session)
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Use service role to bypass RLS for the privileged inserts
    const admin = createServiceClient();

    const { data: org, error: orgError } = await admin
      .from("organisations")
      .insert({ name: name.trim(), slug: slug.trim(), created_by: user.id })
      .select()
      .single();

    if (orgError) {
      if (orgError.code === "23505") {
        return NextResponse.json(
          { error: "That workspace URL is already taken. Try a different name." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    const { error: memberError } = await admin
      .from("org_members")
      .insert({ org_id: org.id, user_id: user.id, org_role: "admin" });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ org });
  } catch {
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
