import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { buildReportExport, filterReportRows, type ReportEmployeeRow } from "@/lib/reports/export";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getCurrentOrg();
  if (!ctx) return new Response("Not authenticated", { status: 401 });

  if (slug === "compensation") {
    const allowed =
      ctx.roles.includes("workspace_owner") ||
      ctx.roles.includes("hr_admin") ||
      ctx.roles.includes("finance");
    if (!allowed) return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const department = url.searchParams.get("department") ?? "all";
  const employmentType = url.searchParams.get("employmentType") ?? "all";
  const format = url.searchParams.get("format");

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("full_name,email,job_title,department,status,employment_type,country,start_date,end_date")
    .eq("org_id", ctx.org.id)
    .order("full_name", { ascending: true });

  const rows = filterReportRows((employees ?? []) as ReportEmployeeRow[], { department, employmentType });
  const exportFile = buildReportExport({ slug, rows, format });

  return new Response(exportFile.body, {
    headers: {
      "Content-Type": exportFile.contentType,
      "Content-Disposition": `attachment; filename="atlas-${slug}-report.${exportFile.extension}"`,
    },
  });
}
