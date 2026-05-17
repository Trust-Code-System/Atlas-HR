# Runbook: Big Traffic Spike

## Symptoms

- Product Hunt rank, viral LinkedIn post, press mention, or newsletter drives sudden traffic.
- PostHog realtime users spike.
- Sentry, Supabase, Anthropic, or Stripe errors increase.

## Immediate Actions

1. Watch `/admin/launch-metrics`, Sentry, PostHog, Supabase, and Stripe.
2. Check Anthropic rate-limit responses in generation and Copilot routes.
3. Check Supabase connection usage.
4. Check support tickets for repeated user confusion.
5. Avoid shipping large changes during the spike.

## Bottlenecks

- Vercel web hosting usually scales automatically.
- AI generation may hit provider rate limits.
- Supabase may hit connection or CPU limits.
- Email providers may throttle sudden volume.
- Support load can become the real bottleneck.

## Resolution

- If AI rate-limited, temporarily tighten free preview limits and ask Anthropic for a higher tier.
- If database constrained, scale Supabase and reduce hot queries.
- If support constrained, pin known issues and create canned responses.
- If a key flow breaks, update status page and roll back if regression-related.

## Follow-Up

- Record peak traffic, error rate, signup conversion, activation rate, and support volume.
- Add capacity fixes before the next campaign.
