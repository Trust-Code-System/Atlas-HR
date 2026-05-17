import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServer() {
  if (!stripeClient) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }

    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
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
