import { NextRequest, NextResponse } from "next/server";
import { runWeeklyDigest } from "@/jobs/weekly-digest";

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

  const result = await runWeeklyDigest();
  return NextResponse.json({ ok: true, ...result });
}
