import { FEATURES } from "@/lib/limits";

export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: FEATURES.free,
  },
  pro: {
    name: "Pro",
    priceMonthly: 19,
    priceYearly: 190,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    },
    trialDays: 14,
    features: FEATURES.pro,
  },
  team: {
    name: "Team",
    priceMonthly: 79,
    priceYearly: 790,
    includedSeats: 0,
    employeeLimit: 50,
    seatPriceMonthly: 7,
    seatPriceYearly: 70,
    stripePriceIds: {
      monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
      seatMonthly: process.env.STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID!,
      seatYearly: process.env.STRIPE_TEAM_SEAT_YEARLY_PRICE_ID!,
    },
    trialDays: 14,
    features: FEATURES.team_admin,
  },
  business: {
    name: "Business",
    priceMonthly: 199,
    priceYearly: 1990,
    includedSeats: 0,
    employeeLimit: Infinity,
    seatPriceMonthly: 10,
    seatPriceYearly: 100,
    stripePriceIds: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
      seatMonthly: process.env.STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID!,
      seatYearly: process.env.STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID!,
    },
    trialDays: 14,
    features: FEATURES.business_admin,
  },
  enterprise: {
    name: "Enterprise",
    priceMonthly: null,
    contactSales: true,
    features: FEATURES.enterprise,
  },
} as const;

export type BillingPlan = keyof typeof PLANS;
export type PaidBillingPlan = "pro" | "team" | "business";
export type BillingInterval = "month" | "year";
