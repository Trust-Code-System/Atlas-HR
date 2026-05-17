import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/get-current-org";
import { logActivity } from "@/lib/activity/log";
import { linesToPdf } from "@/lib/reports/export";

export async function GET(request: NextRequest) {
  const ctx = await getCurrentOrg();
  if (!ctx) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ctx.roles.includes("workspace_owner") && !ctx.roles.includes("hr_admin")) {
    return Response.json({ error: "Export access required" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope") ?? "workspace";
  const employeeId = searchParams.get("employeeId");
  const format = searchParams.get("format") ?? "json";

  const supabase = await createClient();
  let query = supabase
    .from("activity_log")
    .select("*")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (scope === "employee" && employeeId) {
    query = query.or(`resource_id.eq.${employeeId},after_value->>employee_id.eq.${employeeId},before_value->>employee_id.eq.${employeeId}`);
  }

  const { data } = await query;
  const rows = data ?? [];

  await logActivity({
    orgId: ctx.org.id,
    resourceType: "workspace",
    resourceId: ctx.org.id,
    resourceDisplayName: `${scope} activity export`,
    action: "downloaded",
    after: { scope, employee_id: employeeId, format, count: rows.length },
  });

  if (format === "pdf") {
    const pdf = linesToPdf([
      `Atlas HR activity export - ${scope}`,
      `Workspace: ${ctx.org.name}`,
      `Generated: ${new Date().toISOString()}`,
      `Rows: ${rows.length}`,
      "",
      ...rows.map((row) => `${row.created_at} | ${row.actor_email ?? "system"} | ${row.action} ${row.resource_type} | ${row.resource_display_name ?? ""}`),
    ]);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="atlas-activity-${scope}.pdf"`,
      },
    });
  }

  return new Response(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="atlas-activity-${scope}.json"`,
    },
  });
}
