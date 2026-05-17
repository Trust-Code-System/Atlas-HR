import { NextRequest, NextResponse } from "next/server";
import ScheduledReport from "@/emails/reports/ScheduledReport";
import { sendEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { buildReportExport, filterReportRows, type ReportEmployeeRow } from "@/lib/reports/export";
import { createAdminClient } from "@/lib/supabase/admin";

function nextSendFor(cadence: string) {
  const next = new Date();
  if (cadence === "monthly") next.setMonth(next.getMonth() + 1);
  else if (cadence === "quarterly") next.setMonth(next.getMonth() + 3);
  else next.setDate(next.getDate() + 7);
  return next.toISOString();
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-cron-secret");

  if (!cronSecret) {
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}` && secretHeader !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: dueReports, error } = await admin
    .from("scheduled_reports")
    .select("id, org_id, report_slug, filter_config, recipients, cadence, format")
    .eq("is_active", true)
    .lte("next_send_at", new Date().toISOString())
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settled = await Promise.allSettled(
    (dueReports ?? []).map(async (report) => {
      try {
        const { data: org } = await admin
          .from("organisations")
          .select("name")
          .eq("id", report.org_id)
          .single();

        const { data: employees } = await admin
          .from("employees")
          .select("full_name,email,job_title,department,status,employment_type,country,start_date,end_date")
          .eq("org_id", report.org_id)
          .order("full_name", { ascending: true });

        const filterConfig = (report.filter_config ?? {}) as {
          department?: string | null;
          employmentType?: string | null;
          employment_type?: string | null;
        };
        const rows = filterReportRows((employees ?? []) as ReportEmployeeRow[], {
          department: filterConfig.department ?? "all",
          employmentType: filterConfig.employmentType ?? filterConfig.employment_type ?? "all",
        });
        const exportFile = buildReportExport({ slug: report.report_slug, rows, format: report.format });
        const filename = `atlas-${report.report_slug}-report.${exportFile.extension}`;
        const workspaceName = org?.name ?? "your workspace";

        // Look up user IDs for recipients so we can generate proper unsubscribe tokens
        const { data: recipientProfiles } = await admin
          .from("profiles")
          .select("id, email")
          .in("email", report.recipients ?? []);
        const recipientIdMap = new Map(
          (recipientProfiles ?? []).map((p: { id: string; email: string }) => [p.email, p.id])
        );

        await Promise.all(
          (report.recipients ?? []).map((recipient: string) => {
            const recipientId = recipientIdMap.get(recipient);
            const recipientUnsub = recipientId
              ? unsubscribeUrl(recipientId, "scheduled_report")
              : undefined;
            return sendEmail({
              to: recipient,
              userId: recipientId,
              type: "scheduled_report",
              subject: `${workspaceName} ${report.report_slug} report`,
              react: ScheduledReport({
                workspaceName,
                reportTitle: `${report.report_slug.replace(/-/g, " ")} report`,
                cadence: report.cadence,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.atlashr.com"}/workspace/reports/${report.report_slug}`,
                unsubscribeUrl: recipientUnsub,
              }),
              unsubscribeUrl: recipientUnsub,
              attachments: [
                {
                  filename,
                  content: exportFile.body,
                  contentType: exportFile.contentType,
                },
              ],
            });
          })
        );

        // Only update last_sent_at after all emails sent successfully
        await admin
          .from("scheduled_reports")
          .update({
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSendFor(report.cadence),
          })
          .eq("id", report.id);

        return { id: report.id, ok: true };
      } catch (err) {
        console.error(`Scheduled report ${report.id} failed:`, err);
        return { id: report.id, ok: false };
      }
    })
  );

  const succeeded = settled.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  const failed = settled.length - succeeded;

  return NextResponse.json({
    ok: true,
    processed: succeeded,
    failed,
  });
}
