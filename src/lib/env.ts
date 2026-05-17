import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRO_MONTHLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_PRO_MONTHLY_PRICE_ID is required"),
  STRIPE_PRO_YEARLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_PRO_YEARLY_PRICE_ID is required"),
  STRIPE_TEAM_MONTHLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_TEAM_MONTHLY_PRICE_ID is required"),
  STRIPE_TEAM_YEARLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_TEAM_YEARLY_PRICE_ID is required"),
  STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID is required"),
  STRIPE_TEAM_SEAT_YEARLY_PRICE_ID: z
    .string()
    .min(1, "STRIPE_TEAM_SEAT_YEARLY_PRICE_ID is required"),
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().min(1, "RESEND_FROM_EMAIL is required"),
  RESEND_REPLY_TO: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  UNSUBSCRIBE_SECRET: z.string().optional(),
  // Sentry — optional until account is created
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z
    .enum(["production", "staging", "development"])
    .optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_STATUS_PAGE_URL: z.string().url().optional(),
  BETTER_STACK_STATUS_API_URL: z.string().url().optional(),
  BETA_SIGNUP_REQUIRED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_BETA_SIGNUP_REQUIRED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL: z.string().url().optional(),
  // Upstash Redis — optional, falls back to in-memory rate limiting when absent
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_PRO_YEARLY_PRICE_ID: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    STRIPE_TEAM_MONTHLY_PRICE_ID: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    STRIPE_TEAM_YEARLY_PRICE_ID: process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
    STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID:
      process.env.STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID,
    STRIPE_TEAM_SEAT_YEARLY_PRICE_ID:
      process.env.STRIPE_TEAM_SEAT_YEARLY_PRICE_ID,
    STRIPE_BUSINESS_MONTHLY_PRICE_ID: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    STRIPE_BUSINESS_YEARLY_PRICE_ID: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID:
      process.env.STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID,
    STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID:
      process.env.STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
    CRON_SECRET: process.env.CRON_SECRET,
    UNSUBSCRIBE_SECRET: process.env.UNSUBSCRIBE_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT as
      | "production"
      | "staging"
      | "development"
      | undefined,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    POSTHOG_PERSONAL_API_KEY: process.env.POSTHOG_PERSONAL_API_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    NEXT_PUBLIC_STATUS_PAGE_URL: process.env.NEXT_PUBLIC_STATUS_PAGE_URL,
    BETTER_STACK_STATUS_API_URL: process.env.BETTER_STACK_STATUS_API_URL,
    BETA_SIGNUP_REQUIRED: process.env.BETA_SIGNUP_REQUIRED as "true" | "false" | undefined,
    NEXT_PUBLIC_BETA_SIGNUP_REQUIRED: process.env.NEXT_PUBLIC_BETA_SIGNUP_REQUIRED as
      | "true"
      | "false"
      | undefined,
    NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL:
      process.env.NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!result.success) {
    const missing = result.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Missing required environment variables: ${missing}`);
  }

  return result.data;
}

// Only validate on server side (SUPABASE_SERVICE_ROLE_KEY not available in browser)
export const env =
  typeof window === "undefined"
    ? validateEnv()
    : {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: "",
        ANTHROPIC_API_KEY: "",
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
        STRIPE_WEBHOOK_SECRET: "",
        STRIPE_PRO_MONTHLY_PRICE_ID: "",
        STRIPE_PRO_YEARLY_PRICE_ID: "",
        STRIPE_TEAM_MONTHLY_PRICE_ID: "",
        STRIPE_TEAM_YEARLY_PRICE_ID: "",
        STRIPE_TEAM_SEAT_MONTHLY_PRICE_ID: "",
        STRIPE_TEAM_SEAT_YEARLY_PRICE_ID: "",
        STRIPE_BUSINESS_MONTHLY_PRICE_ID: undefined,
        STRIPE_BUSINESS_YEARLY_PRICE_ID: undefined,
        STRIPE_BUSINESS_SEAT_MONTHLY_PRICE_ID: undefined,
        STRIPE_BUSINESS_SEAT_YEARLY_PRICE_ID: undefined,
        RESEND_API_KEY: "",
        RESEND_FROM_EMAIL: "",
        RESEND_REPLY_TO: "",
        CRON_SECRET: undefined,
        UNSUBSCRIBE_SECRET: undefined,
        SENTRY_DSN: undefined,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        SENTRY_AUTH_TOKEN: undefined,
        SENTRY_ORG: undefined,
        SENTRY_PROJECT: undefined,
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env
          .NEXT_PUBLIC_SENTRY_ENVIRONMENT as
          | "production"
          | "staging"
          | "development"
          | undefined,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        POSTHOG_PERSONAL_API_KEY: undefined,
        SUPPORT_EMAIL: undefined,
        NEXT_PUBLIC_STATUS_PAGE_URL: process.env.NEXT_PUBLIC_STATUS_PAGE_URL,
        BETTER_STACK_STATUS_API_URL: undefined,
        BETA_SIGNUP_REQUIRED: undefined,
        NEXT_PUBLIC_BETA_SIGNUP_REQUIRED: process.env
          .NEXT_PUBLIC_BETA_SIGNUP_REQUIRED as "true" | "false" | undefined,
        NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL:
          process.env.NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL,
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      };
