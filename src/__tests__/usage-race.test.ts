import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITS } from "@/lib/limits";

vi.mock("@/lib/supabase/server", async () => {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return {
    createClient: async () => createAdminClient(),
  };
});

const { consumeUsage, getUsageAdmin } = await import("@/lib/usage");

const TEST_USER_PREFIX = "race-test-usage-";

function requireRaceEnv() {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Race test environment is incomplete: ${missing.join(", ")} missing. ` +
        "Create .env.test.local with an isolated Supabase project before running destructive stress tests."
    );
  }
}

async function createTestFreeUser(): Promise<string> {
  requireRaceEnv();
  const admin = createAdminClient();
  const email = `${TEST_USER_PREFIX}${crypto.randomUUID()}@test.atlashr.local`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "Usage Race Test User" },
  });

  if (error || !data.user) throw error ?? new Error("User creation failed");

  const { error: profileError } = await (admin as any).from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: "Usage Race Test User",
    role: "free",
    onboarding_completed: true,
  });

  if (profileError) throw profileError;
  return data.user.id;
}

async function cleanupTestUser(userId: string | undefined) {
  if (!userId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = createAdminClient();
  await (admin as any).from("usage_tracking").delete().eq("user_id", userId);
  await (admin as any).from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

describe("Usage tracking under concurrency", () => {
  let testUserId: string | undefined;

  beforeEach(async () => {
    testUserId = await createTestFreeUser();
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
    testUserId = undefined;
  });

  test("30 concurrent generate requests respect free tier limit of 20", async () => {
    const requests = Array.from({ length: 30 }, () =>
      consumeUsage(testUserId!, "free", "tool_generations_per_month", "month")
    );

    const results = await Promise.all(requests);
    const allowed = results.filter((result) => result.allowed);
    const blocked = results.filter((result) => !result.allowed);

    console.log("Usage 30x tool generation results:", {
      total: results.length,
      allowed: allowed.length,
      blocked: blocked.length,
      sampleAllowed: allowed[0],
      sampleBlocked: blocked[0],
    });

    expect(allowed.length).toBe(LIMITS.free.tool_generations_per_month);
    expect(blocked.length).toBe(30 - LIMITS.free.tool_generations_per_month);

    const used = await getUsageAdmin(testUserId!, "tool_generations_per_month", "month");
    expect(used).toBe(LIMITS.free.tool_generations_per_month);
  });

  test("mixed concurrent + sequential under limit boundary", async () => {
    for (let i = 0; i < 15; i += 1) {
      const result = await consumeUsage(testUserId!, "free", "tool_generations_per_month", "month");
      expect(result.allowed).toBe(true);
    }

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumeUsage(testUserId!, "free", "tool_generations_per_month", "month")
      )
    );

    const allowed = results.filter((result) => result.allowed);
    const blocked = results.filter((result) => !result.allowed);

    expect(allowed.length).toBe(5);
    expect(blocked.length).toBe(5);

    const used = await getUsageAdmin(testUserId!, "tool_generations_per_month", "month");
    expect(used).toBe(LIMITS.free.tool_generations_per_month);
  });

  test("copilot daily limit uses the configured free limit", async () => {
    const limit = LIMITS.free.copilot_messages_per_day;
    const totalRequests = limit + 25;
    const results = await Promise.all(
      Array.from({ length: totalRequests }, () =>
        consumeUsage(testUserId!, "free", "copilot_messages_per_day", "day")
      )
    );

    const allowed = results.filter((result) => result.allowed);
    const blocked = results.filter((result) => !result.allowed);

    expect(allowed.length).toBe(limit);
    expect(blocked.length).toBe(totalRequests - limit);

    const used = await getUsageAdmin(testUserId!, "copilot_messages_per_day", "day");
    expect(used).toBe(limit);
  });

  test("pro user with Infinity limit allows all concurrent requests", async () => {
    const admin = createAdminClient();
    await (admin as any).from("profiles").update({ role: "pro" }).eq("id", testUserId);

    const results = await Promise.all(
      Array.from({ length: 100 }, () =>
        consumeUsage(testUserId!, "pro", "tool_generations_per_month", "month")
      )
    );

    expect(results.filter((result) => result.allowed).length).toBe(100);
  });

  test("lock contention does not produce phantom failures", async () => {
    const start = Date.now();
    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        consumeUsage(testUserId!, "free", "tool_generations_per_month", "month")
      )
    );
    const elapsed = Date.now() - start;

    console.log("Usage 50x lock contention elapsed ms:", elapsed);

    expect(elapsed).toBeLessThan(5000);
    expect(results.every((result) => typeof result.allowed === "boolean")).toBe(true);
    expect(results.filter((result) => result.allowed).length).toBe(LIMITS.free.tool_generations_per_month);
  });
});
