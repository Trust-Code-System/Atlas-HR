import { createAdminClient } from "@/lib/supabase/admin";

export type ServiceStatus = "operational" | "degraded" | "outage";

export type CheckResult = {
  status: "up" | "down" | "unknown";
  latency_ms: number | null;
  error?: string;
};

export type HealthReport = {
  status: ServiceStatus;
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    ai: CheckResult;
    email: CheckResult;
    stripe: CheckResult;
  };
};

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) return { status: "down", latency_ms: Date.now() - start, error: error.message };
    return { status: "up", latency_ms: Date.now() - start };
  } catch (err) {
    return { status: "down", latency_ms: Date.now() - start, error: String(err) };
  }
}

function checkEnvService(key: string): CheckResult {
  if (process.env[key]) return { status: "up", latency_ms: null };
  return { status: "unknown", latency_ms: null, error: `${key} not configured` };
}

function overallStatus(checks: HealthReport["checks"]): ServiceStatus {
  const statuses = Object.values(checks).map((c) => c.status);
  if (statuses.includes("down")) return "outage";
  if (statuses.includes("unknown")) return "degraded";
  return "operational";
}

export async function runHealthChecks(): Promise<HealthReport> {
  const [database] = await Promise.all([checkDatabase()]);

  const checks: HealthReport["checks"] = {
    database,
    ai: checkEnvService("ANTHROPIC_API_KEY"),
    email: checkEnvService("RESEND_API_KEY"),
    stripe: checkEnvService("STRIPE_SECRET_KEY"),
  };

  return {
    status: overallStatus(checks),
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    checks,
  };
}
