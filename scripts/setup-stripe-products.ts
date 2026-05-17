import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function setupProducts() {
  const { stripe } = await import("../src/lib/stripe/server");

  const pro = await stripe.products.create({
    name: "Atlas HR Pro",
    description:
      "Unlimited generations, premium templates, all courses, full Copilot.",
  });

  const proMonthly = await stripe.prices.create({
    product: pro.id,
    unit_amount: 1900,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Pro Monthly",
  });

  const proYearly = await stripe.prices.create({
    product: pro.id,
    unit_amount: 19000,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Pro Yearly",
  });

  const team = await stripe.products.create({
    name: "Atlas HR Team",
    description: "Everything in Pro plus Mini-HRIS and team workspace.",
  });

  const teamMonthly = await stripe.prices.create({
    product: team.id,
    unit_amount: 7900,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Team Monthly Base",
  });

  const teamYearly = await stripe.prices.create({
    product: team.id,
    unit_amount: 79000,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Team Yearly Base",
  });

  const teamSeat = await stripe.products.create({
    name: "Atlas HR Team - Additional Seat",
  });

  const teamSeatMonthly = await stripe.prices.create({
    product: teamSeat.id,
    unit_amount: 700,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Team Seat Monthly",
  });

  const teamSeatYearly = await stripe.prices.create({
    product: teamSeat.id,
    unit_amount: 7000,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Team Seat Yearly",
  });

  const business = await stripe.products.create({
    name: "Atlas HR Business",
    description:
      "Advanced HRIS controls, unlimited employees, custom workflows, custom reports, compliance flags, helpdesk, surveys, branding, and priority support.",
  });

  const businessMonthly = await stripe.prices.create({
    product: business.id,
    unit_amount: 19900,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Business Monthly Base",
  });

  const businessYearly = await stripe.prices.create({
    product: business.id,
    unit_amount: 199000,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Business Yearly Base",
  });

  const businessSeat = await stripe.products.create({
    name: "Atlas HR Business - Employee Seat",
  });

  const businessSeatMonthly = await stripe.prices.create({
    product: businessSeat.id,
    unit_amount: 1000,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Business Seat Monthly",
  });

  const businessSeatYearly = await stripe.prices.create({
    product: businessSeat.id,
    unit_amount: 10000,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Business Seat Yearly",
  });

  console.log("\nAdd these to your .env.local:");
  console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${proMonthly.id}`);
  console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${proYearly.id}`);
  console.log(`STRIPE_TEAM_MONTHLY_PRICE_ID=${teamMonthly.id}`);
  console.log(`STRIPE_TEAM_YEARLY_PRICE_ID=${teamYearly.id}`);
  console.log(`STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID=${teamSeatMonthly.id}`);
  console.log(`STRIPE_TEAM_SEAT_YEARLY_PRICE_ID=${teamSeatYearly.id}`);
  console.log(`STRIPE_BUSINESS_MONTHLY_PRICE_ID=${businessMonthly.id}`);
  console.log(`STRIPE_BUSINESS_YEARLY_PRICE_ID=${businessYearly.id}`);
  console.log(`STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID=${businessSeatMonthly.id}`);
  console.log(`STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID=${businessSeatYearly.id}`);
}

setupProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
