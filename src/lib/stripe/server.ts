import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServer() {
  if (!stripeClient) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }

    // No explicit apiVersion — the installed Stripe SDK pins its own default.
    // Hardcoding the literal breaks `tsc` whenever the SDK bumps its
    // LatestApiVersion (the type is a single literal, not a union), which is
    // what failed the Vercel build when its `^22` range resolved a newer 22.x.
    stripeClient = new Stripe(stripeSecretKey, {
      appInfo: {
        name: "Atlas HR",
      },
    });
  }

  return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeServer(), prop, receiver);
  },
});
