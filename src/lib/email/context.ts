import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/stripe/products";
import { stripe } from "@/lib/stripe/server";

type ProfileContext = {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string;
};

type SubscriptionRow = {
  id: string;
  stripe_subscription_id: string;
  user_id: string | null;
  org_id: string | null;
  plan: "pro" | "team" | "business" | "enterprise";
  status: string;
  billing_interval: "month" | "year";
  current_period_end: string;
  quantity: number | null;
};

function firstName(value: string | null | undefined, email: string) {
  const name = value?.trim();
  if (name) return name.split(/\s+/)[0] ?? "there";
  return email.split("@")[0] || "there";
}

export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(value: string | number | null | undefined) {
  if (!value) return "not scheduled";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export async function getUserEmailContext(userId: string): Promise<ProfileContext | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", userId)
    .single();

  if (!data?.email) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    firstName: firstName(data.full_name, data.email),
  };
}

export async function getSubscriptionEmailRecipient(subscription: SubscriptionRow) {
  if (subscription.user_id) return getUserEmailContext(subscription.user_id);

  if (subscription.org_id) {
    const supabase = createAdminClient();
    const { data: adminMember } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", subscription.org_id)
      .contains("roles", ["workspace_owner"])
      .limit(1)
      .maybeSingle();

    if (adminMember?.user_id) return getUserEmailContext(adminMember.user_id);
  }

  return null;
}

export async function getPlanContext(stripeSubscriptionId: string) {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id, user_id, org_id, plan, status, billing_interval, current_period_end, quantity")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  const subscription = row as SubscriptionRow | null;
  if (!subscription) return null;

  const plan = PLANS[subscription.plan];
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data.price"],
  });
  const amountCents = stripeSubscription.items.data.reduce((sum, item) => {
    return sum + (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
  }, 0);

  return {
    subscription,
    planName: plan.name,
    interval: subscription.billing_interval,
    amount: formatMoney(amountCents, stripeSubscription.currency),
    amountCents,
    nextBilling: formatDate(subscription.current_period_end),
    quantity: subscription.quantity ?? 1,
  };
}

export async function getInvoiceContext(invoice: Stripe.Invoice) {
  const lines = invoice.lines.data.map((line) => ({
    description: line.description ?? "Atlas HR subscription",
    amount: formatMoney(line.amount, invoice.currency),
  }));
  const paymentIntent = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
  let paymentMethod = "saved payment method";

  if (typeof paymentIntent === "string") {
    const intent = await stripe.paymentIntents.retrieve(paymentIntent, {
      expand: ["payment_method"],
    });
    const method = intent.payment_method;
    if (method && typeof method !== "string" && method.card) {
      paymentMethod = `${method.card.brand.toUpperCase()} ending in ${method.card.last4}`;
    }
  }

  const firstLine = invoice.lines.data[0];
  const taxAmounts = (invoice as unknown as { total_tax_amounts?: Array<{ amount: number }> }).total_tax_amounts ?? [];
  return {
    invoiceId: invoice.id,
    amountPaid: formatMoney(invoice.amount_paid, invoice.currency),
    amountDue: formatMoney(invoice.amount_due, invoice.currency),
    currency: invoice.currency.toUpperCase(),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? "",
    invoicePdf: invoice.invoice_pdf ?? "",
    lines,
    tax: formatMoney(taxAmounts.reduce((sum, tax) => sum + tax.amount, 0), invoice.currency),
    periodStart: formatDate(firstLine?.period?.start),
    periodEnd: formatDate(firstLine?.period?.end),
    paymentMethod,
  };
}
