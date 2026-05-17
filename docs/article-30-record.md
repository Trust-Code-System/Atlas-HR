# Atlas HR Article 30 Record of Processing Activities

Draft internal record. Pending privacy counsel review.

## Account Management

Purpose: create accounts, authenticate users, manage profiles, settings, roles, and security.
Data subjects: users, organisation admins, invited teammates.
Personal data: name, email, role, country, device security metadata, preferences.
Recipients: Supabase, Vercel, Resend where notifications are sent.
Transfers: infrastructure and subprocessors may process data outside Nigeria, EU, UK, or US.
Retention: profile until deletion; device records 90 days.
Security: TLS, managed auth, RBAC, service-role separation, audit-oriented logs.

## HR Workspace and Mini-HRIS

Purpose: help customers manage HR records, documents, leave, and employee information.
Data subjects: employees, candidates, contractors, HR users.
Personal data: names, emails, job data, leave records, generated documents, notes, organisation membership.
Recipients: Supabase, Vercel, Anthropic when AI features are used.
Transfers: as described in DPA and Privacy Policy.
Retention: paid records until deletion; free generated documents 30 days where applicable.
Security: RBAC, organisation scoping, encryption in transit, database RLS where applicable.

## Billing

Purpose: subscriptions, invoices, tax, checkout, customer portal, and payment notifications.
Data subjects: paying users, organisation admins.
Personal data: billing identifiers, invoices, customer IDs, tax details handled by Stripe.
Recipients: Stripe, Supabase, Resend.
Retention: invoices retained for legal/accounting need; webhook events 90 days.
Security: Stripe-hosted payment fields, webhook signature verification, service-role writes.

## Email and Notifications

Purpose: transactional email, community notifications, invites, digests, and billing notices.
Data subjects: users and invited teammates.
Personal data: email address, notification preferences, email logs, message context.
Recipients: Resend.
Retention: email logs 365 days.
Security: unsubscribe controls, preference checks, limited logging.

## Analytics and Product Improvement

Purpose: understand product usage and reliability after consent.
Data subjects: visitors and users who consent to analytics.
Personal data: event data, browser metadata, page views, pseudonymous identifiers.
Recipients: PostHog where enabled.
Retention: usage tracking 365 days unless configured otherwise in provider settings.
Security: consent gating, opt-out support, no analytics before consent.
