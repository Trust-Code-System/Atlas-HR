import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgCtx = await getCurrentOrg();
  if (!orgCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the document belongs to an employee in the user's org before returning it
  const { data: document, error } = await supabase
    .from("employee_documents")
    .select("file_url, employee_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!document?.file_url) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Confirm the employee belongs to the current org
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", document.employee_id)
    .eq("org_id", orgCtx.org.id)
    .single();

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: signed, error: signedError } = await supabase.storage
    .from("employee-documents")
    .createSignedUrl(document.file_url, 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: signedError?.message ?? "Could not open document" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
