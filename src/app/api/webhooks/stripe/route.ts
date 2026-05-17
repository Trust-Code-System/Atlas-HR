import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpsert,
  handleTrialWillEnd,
} from "@/lib/stripe/handlers";
import { stripe } from "@/lib/stripe/server";

type DbResult = { error: { code: string; message: string } | null };
type WebhookDb = {
  from(table: string): {
    insert(values: unknown): Promise<DbResult>;
    update(values: Record<string, unknown>): { eq(col: string, val: unknown): Promise<DbResult> };
    delete(): { eq(col: string, val: unknown): { is(col: string, val: null): Promise<DbResult> } };
  };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient() as unknown as WebhookDb;

  // INSERT-FIRST idempotency: claim the event atomically before processing.
  // stripe_webhook_events.id is a PRIMARY KEY — a duplicate delivery from Stripe
  // returns Postgres error code 23505 (unique_violation), which we use as the
  // dedup signal. This closes the race condition in the old SELECT → process → INSERT
  // pattern, where two simultaneous deliveries could both pass the SELECT check.
  const { error: claimError } = await supabase
    .from("stripe_webhook_events")
    .insert({
      id: event.id,
      type: event.type,
      payload: event,
      processed_at: null, // Null until processing completes; set below on success
    });

  if (claimError) {
    if (claimError.code === "23505") {
      // Another concurrent delivery already claimed this event — safe to ack
      return NextResponse.json({ received: true, deduplicated: true });
    }
    console.error("Webhook event claim failed:", claimError.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // We hold the exclusive claim — process the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled Stripe webhook event: ${event.type}`);
    }

    // Mark the claim as successfully processed
    await supabase
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Release the claim so Stripe's next retry can reprocess this event.
    // Only delete if processed_at is still null (i.e., we haven't marked success).
    await supabase
      .from("stripe_webhook_events")
      .delete()
      .eq("id", event.id)
      .is("processed_at", null);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
