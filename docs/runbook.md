# Atlas HR Runbook

## Purpose
Operational procedures for launch week and early customer support. Keep dashboard links, credentials, and named owners outside this file if they are sensitive; store them in the team's password manager or private ops workspace.

## Common Admin Tasks
### Refund a Customer
1. Open the customer in Stripe.
2. Confirm the Atlas user email and Stripe customer ID match the support request.
3. Issue the refund from the payment details page.
4. Add a note to the support ticket with refund amount, reason, and Stripe refund ID.
5. Confirm the subscription state in Atlas HR after the next webhook.

### Cancel or Downgrade a Subscription
1. Prefer customer self-service through Stripe Customer Portal.
2. If support must intervene, cancel in Stripe and verify the webhook updates `subscriptions`.
3. Confirm `profiles.role` or organisation plan changes only at the intended lifecycle point.
4. Check generated document retention before closing the ticket.

### Handle a Support Ticket
1. Review `/admin/support` and the user's recent activity.
2. Reproduce the issue in a non-production test environment when possible.
3. Respond with a clear status within the published SLA.
4. Escalate billing, data loss, security, or access-control issues immediately.

### Ban or Disable a User
1. Confirm the reason and evidence.
2. Record the action in the admin audit log.
3. Disable the account in Supabase Auth.
4. Preserve relevant records for legal/security review.

## Dashboard Links To Fill Before Launch
- Stripe dashboard:
- Supabase dashboard:
- Vercel dashboard:
- Sentry dashboard:
- PostHog dashboard:
- Resend dashboard:

## Emergency Contacts To Fill Before Launch
- Founder/on-call:
- Vercel support:
- Supabase support:
- Stripe support:
- Resend support:

## Existing Detailed Runbooks
- `docs/runbook/stripe-webhook-backlog.md`
- `docs/runbook/database-slow.md`
- `docs/runbook/sentry-alert-spike.md`
- `docs/runbook/support-inbox-overflowing.md`
- `docs/runbook/traffic-spike.md`
- `docs/runbook/negative-review.md`
