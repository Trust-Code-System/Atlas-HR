# Atlas HR Incident Playbooks

## Site Down
1. Check Vercel deployment status and recent deploys.
2. Check `/api/health` and Sentry for the first failing service.
3. Roll back the latest deployment if the incident correlates with a deploy.
4. Post a status update if the outage affects users.
5. Write a short post-incident note with cause, impact, and prevention.

## Stripe Webhooks Failing
1. Check Stripe webhook delivery logs.
2. Check `stripe_webhook_events` for stuck or duplicate events.
3. Review Sentry and hosting logs for `/api/webhooks/stripe`.
4. Replay failed events from Stripe once the handler is healthy.
5. Reconcile subscriptions and invoices against Stripe before closing.

## Customer Reports Data Loss
1. Acknowledge the ticket and freeze destructive cleanup jobs if relevant.
2. Check audit logs and generated document retention state.
3. Compare Supabase records with backups.
4. Restore to staging first if recovery is needed.
5. Communicate clearly what was lost, recovered, and changed.

## DDoS Or Traffic Spike
1. Check Vercel traffic and function logs.
2. Enable or tighten firewall/rate-limiting controls.
3. Disable expensive non-critical features if needed.
4. Watch Anthropic, Supabase, and Vercel spend.
5. Post a status update if users are affected.

## Security Or Privacy Incident
1. Preserve logs and stop the exposure.
2. Follow `docs/breach-response-plan.md`.
3. Identify affected users, data categories, and jurisdictions.
4. Notify subprocessors or regulators as required.
5. Complete a post-incident review.
