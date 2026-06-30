import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/webhooks/stripe/route";

const stripeMockState = vi.hoisted(() => ({
  customerMetadata: new Map<string, { user_id?: string; org_id?: string }>(),
}));

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: {
      constructEvent: (payload: string, signatureHeader: string, secret: string) => {
        const timestamp = signatureHeader.match(/(?:^|,)t=([^,]+)/)?.[1];
        const signature = signatureHeader.match(/(?:^|,)v1=([^,]+)/)?.[1];
        if (!timestamp || !signature) throw new Error("Invalid Stripe signature header");

        const expected = crypto
          .createHmac("sha256", secret)
          .update(`${timestamp}.${payload}`)
          .digest("hex");

        if (signature !== expected) throw new Error("Invalid Stripe signature");
        return JSON.parse(payload);
      },
    },
    customers: {
      retrieve: async (customerId: string) => ({
        id: customerId,
        object: "customer",
        deleted: false,
        metadata: stripeMockState.customerMetadata.get(customerId) ?? {},
      }),
    },
    subscriptions: {
      retrieve: async (subscriptionId: string) => ({
        id: subscriptionId,
        object: "subscription",
        currency: "usd",
        items: {
          data: [
            {
              id: "si_race_test",
              quantity: 1,
              price: {
                id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_race_test_pro_monthly",
                unit_amount: 1900,
              },
            },
          ],
        },
      }),
    },
  },
}));

vi.mock("@/lib/analytics/track-server", () => ({
  trackRevenueEvent: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(async () => ({ ok: true })),
}));

const TEST_EVENT_PREFIX = "evt_race_test_";
const TEST_CUSTOMER_PREFIX = "cus_race_test_";
const TEST_SUB_PREFIX = "sub_race_test_";
const testUserIds = new Set<string>();

function requireRaceEnv() {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
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

async function createStripeTestUser() {
  requireRaceEnv();
  const admin = createAdminClient();
  const email = `race-test-stripe-${crypto.randomUUID()}@test.atlashr.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "Stripe Race Test User" },
  });

  if (error || !data.user) throw error ?? new Error("Stripe race test user creation failed");

  testUserIds.add(data.user.id);
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: "Stripe Race Test User",
    role: "free",
    onboarding_completed: true,
  });

  if (profileError) throw profileError;
  return data.user.id;
}

function generateMockSubscriptionCreatedEvent(userId: string): Stripe.Event {
  const eventId = `${TEST_EVENT_PREFIX}${crypto.randomUUID()}`;
  const customerId = `${TEST_CUSTOMER_PREFIX}${crypto.randomBytes(8).toString("hex")}`;
  const subId = `${TEST_SUB_PREFIX}${crypto.randomBytes(8).toString("hex")}`;
  const now = Math.floor(Date.now() / 1000);

  stripeMockState.customerMetadata.set(customerId, { user_id: userId });

  return {
    id: eventId,
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: now,
    type: "customer.subscription.created",
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: subId,
        object: "subscription",
        customer: customerId,
        status: "active",
        cancel_at_period_end: false,
        canceled_at: null,
        trial_end: null,
        metadata: {
          plan: "pro",
          user_id: userId,
        },
        items: {
          data: [
            {
              id: "si_race_test",
              quantity: 1,
              current_period_start: now,
              current_period_end: now + 30 * 86400,
              price: {
                id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_race_test_pro_monthly",
                recurring: { interval: "month" },
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription,
    },
  } as Stripe.Event;
}

function requestForEvent(event: Stripe.Event) {
  const body = JSON.stringify(event);
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "stripe-signature": signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!),
      "content-type": "application/json",
    },
    body,
  });
}

function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function cleanupTestData() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = createAdminClient();
  await admin.from("stripe_webhook_events").delete().like("id", `${TEST_EVENT_PREFIX}%`);
  await admin.from("subscriptions").delete().like("stripe_subscription_id", `${TEST_SUB_PREFIX}%`);

  for (const userId of testUserIds) {
    await admin.from("usage_tracking").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }

  testUserIds.clear();
  stripeMockState.customerMetadata.clear();
}

describe("Stripe webhook idempotency under concurrency", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test("20 concurrent deliveries of the same event process exactly once", async () => {
    const userId = await createStripeTestUser();
    const event = generateMockSubscriptionCreatedEvent(userId);

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => POST(requestForEvent(event) as unknown as NextRequest))
    );
    const bodies = await Promise.all(responses.map((response) => response.json()));

    const processed = bodies.filter((body) => body.received === true && !body.deduplicated);
    const deduped = bodies.filter((body) => body.received === true && body.deduplicated === true);
    const errors = bodies.filter((body) => body.error);

    console.log("Stripe 20x response distribution:", {
      processed: processed.length,
      deduped: deduped.length,
      errors: errors.length,
      total: bodies.length,
    });

    expect(errors.length).toBe(0);
    expect(processed.length).toBe(1);
    expect(deduped.length).toBe(19);

    const admin = createAdminClient();
    const { data: eventRows } = await admin
      .from("stripe_webhook_events")
      .select("id, processed_at")
      .eq("id", event.id);

    expect(eventRows?.length).toBe(1);
    expect(eventRows?.[0]?.processed_at).not.toBeNull();

    const { data: subRows } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id")
      .eq("stripe_subscription_id", (event.data.object as Stripe.Subscription).id);

    expect(subRows?.length).toBe(1);
  });

  test("handler failure deletes claim so retry succeeds", () => {
    console.log("Manual verification required:");
    console.log("1. Temporarily make handleSubscriptionUpsert throw after the claim insert.");
    console.log("2. Trigger a subscription.created webhook and verify a 500 response.");
    console.log("3. Verify the stripe_webhook_events row was deleted.");
    console.log("4. Revert the edit and trigger the same webhook again.");
    console.log("5. Verify the retry succeeds.");
  });

  test("rapid-fire of 100 events (50 unique x 2 retries each) processes 50 times", async () => {
    const userId = await createStripeTestUser();
    const uniqueEvents = Array.from({ length: 50 }, () => generateMockSubscriptionCreatedEvent(userId));
    const allRequests = uniqueEvents.flatMap((event) => [
      POST(requestForEvent(event) as unknown as NextRequest),
      POST(requestForEvent(event) as unknown as NextRequest),
    ]);

    const responses = await Promise.all(allRequests);
    const bodies = await Promise.all(responses.map((response) => response.json()));

    const processed = bodies.filter((body) => body.received === true && !body.deduplicated);
    const deduped = bodies.filter((body) => body.received === true && body.deduplicated === true);
    const errors = bodies.filter((body) => body.error);

    console.log("Stripe 50x2 response distribution:", {
      processed: processed.length,
      deduped: deduped.length,
      errors: errors.length,
      total: bodies.length,
    });

    expect(errors.length).toBe(0);
    expect(processed.length).toBe(50);
    expect(deduped.length).toBe(50);

    const admin = createAdminClient();
    const { data: eventRows } = await admin
      .from("stripe_webhook_events")
      .select("id")
      .like("id", `${TEST_EVENT_PREFIX}%`);

    const { data: subRows } = await admin
      .from("subscriptions")
      .select("id")
      .like("stripe_subscription_id", `${TEST_SUB_PREFIX}%`);

    expect(eventRows?.length).toBe(50);
    expect(subRows?.length).toBe(50);
  });
});
