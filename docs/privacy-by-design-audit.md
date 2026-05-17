# Atlas HR Privacy-by-Design Audit

Date: 2026-05-07
Status: Draft internal checklist. Requires production verification before launch.

## Checklist

- [x] Sign-up form collects minimal data: email, password, and name.
- [x] Onboarding optional fields are presented separately from account creation.
- [x] Transactional email templates do not include tracking pixels.
- [x] Avatar uploads are redrawn through browser canvas before upload, stripping typical EXIF metadata.
- [x] Free-tier document retention warning exists in the dashboard documents view.
- [x] Community anonymous mode is implemented in community posting and display flows.
- [x] Data export includes profile, documents, Copilot conversations, community posts, saved items, invoices, devices, and organisation data available to the user.
- [x] Account deletion uses Supabase admin user deletion; cascade behavior must be verified against production schema before launch.
- [x] No Sentry configuration exists yet. When Sentry is added in Phase D, configure PII scrubbing before enabling it.
- [x] User-Agent is stored as a SHA-256 hash in `user_devices`; raw IP is not stored by the app.
- [x] Analytics are gated behind cookie consent. Fresh-browser Playwright verification found no PostHog requests before consent or after Reject all.
- [x] Cookie consent can be revoked or changed in `/settings/privacy`.
- [x] California-style Do Not Sell or Share link is available at `/do-not-sell`.

## Required Production Checks

- Verify account deletion cascades with a real test account and direct database queries.
- Verify no analytics, error tracking, chat widgets, pixels, or third-party scripts fire before consent in production.
- Verify Supabase `pg_cron` jobs are installed and running.
- Verify lawyer-reviewed legal pages before removing draft banners.
