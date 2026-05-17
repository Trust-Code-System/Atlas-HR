# Post-Launch Operations

## T-7 Days

- Final beta cycle complete; all P0/P1 bugs fixed.
- Stripe live products, prices, portal, and webhook endpoints verified.
- Sentry production events and alerts verified.
- PostHog production events and dashboards verified.
- Status page live and linked from the app.
- Support inbox monitored with weekday business-hour coverage.
- Help center, contact form, and admin support inbox verified.
- Demo video, landing copy, legal pages, and press kit finalized.
- Beta users notified of launch date and referral incentive.

## T-1 Day

- Smoke test production sign-up, onboarding, first useful action, checkout, cancellation, and support ticket flow.
- Verify webhook delivery in Stripe Dashboard.
- Verify welcome, receipt, support, and billing emails reach Gmail and Outlook inboxes.
- Verify `/admin/launch-metrics` is loading.
- Product Hunt assets uploaded.
- LinkedIn launch post drafted.
- Personal launch email drafted.
- Press pitches sent.

## Launch Day

Use `/admin/launch-metrics` as the war-room dashboard. It refreshes every 60 seconds and tracks signups, paid conversions, MRR, trials, active usage, support tickets, beta feedback, top tools, top saved articles, and recent webhook activity.

Monitor continuously:

- Sentry new issues and error-rate alerts.
- PostHog realtime traffic, signup sources, activation events, and funnels.
- Stripe payments, failed webhooks, and failed payments.
- Support tickets and replies.
- Product Hunt and LinkedIn comments.
- Status page incidents.

Reply targets:

- Product Hunt comments: within 1 hour.
- LinkedIn comments: within 1 hour.
- Support tickets: within 1 hour on launch day.
- P0 incidents: acknowledge publicly within 30 minutes.

End-of-day notes:

- Visits, signups, paid conversions, support tickets, top errors, top user confusion, and launch-channel performance.
- P0/P1 issues to fix the next day.
- Thank-you post with factual numbers and what comes next.

## Launch Week

Daily:

- Morning: review Sentry, support, failed payments, webhook events.
- Midday: publish or engage on LinkedIn and HR communities.
- Afternoon: talk to 2-3 high-engagement users.
- Evening: ship one small improvement if it is low-risk.

Metrics to watch:

- 24-hour signups and paid conversions.
- Day-3 activation rate.
- Day-7 retention.
- Support ticket themes.
- Top failed or abandoned flows.

## Weeks 2-4

- Weekly Friday ship cycle.
- Weekly user update email.
- Monthly metrics review: cohort retention, activation, conversion, churn.
- Monthly content drop based on search, support, and community questions.
- Do not add a major new feature in the first four weeks.

## Decision Rules

- Signups low: revisit positioning and channels.
- Signups healthy, activation low: fix onboarding and first-use paths.
- Activation healthy, retention low: fix product value and recurring workflows.
- Support volume high: create canned responses and help articles before adding features.
- One loud request is not a roadmap. Look for repeated patterns across support, beta feedback, calls, and analytics.
