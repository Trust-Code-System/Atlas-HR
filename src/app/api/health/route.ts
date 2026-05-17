import { runHealthChecks } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await runHealthChecks();
  const httpStatus = report.status === "outage" ? 503 : 200;

  return Response.json(report, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store",
      "X-Health-Status": report.status,
    },
  });
}
