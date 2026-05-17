# Runbook: Stripe Webhook Backlog

## Symptoms

- Stripe Dashboard shows failed webhook deliveries.
- New subscriptions do not unlock access.
- Receipts, trial conversion, or cancellation emails do not send.
- `/admin/launch-metrics` shows no recent webhook events during payment activity.

## Immediate Actions

1. Open Stripe Dashboard -> Developers -> Webhooks.
2. Inspect the latest failed delivery and response body.
3. Check `/api/webhooks/stripe` logs in Vercel.
4. Confirm `STRIPE_WEBHOOK_SECRET` matches the live endpoint.
5. Confirm the webhook route can reach Supabase with service-role credentials.

## Common Causes

- Wrong live/test webhook secret.
- Missing live Stripe price IDs.
- Supabase service role unavailable.
- Handler throws while mapping customer metadata.
- Duplicate or unsupported event payload.

## Resolution

1. Patch the webhook handler or environment variable.
2. Deploy or update env as needed.
3. Replay failed Stripe events from the Stripe Dashboard.
4. Verify affected users now have the correct `profiles.role` or org plan.
5. Send manual support replies to users affected by billing access delay.

## Prevention

- Keep Stripe live and test endpoints separate.
- Do one real-card production purchase before launch, then refund it.
- Monitor failed deliveries during launch day.
