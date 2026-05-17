# Atlas HR Beta Program

## Cohort Target

Recruit 30-50 HR professionals before public launch:

- 5-10 HR generalists at SMEs
- 5-10 solo HR people or first HR hires
- 5-10 global HR pros from underserved markets
- 5-10 HR business partners at mid-sized companies
- 3-5 HR directors or CHROs
- 2-3 HR consultants

## Invite Flow

Admins manage invites at `/admin/beta`.

During private beta, set:

```bash
BETA_SIGNUP_REQUIRED=true
NEXT_PUBLIC_BETA_SIGNUP_REQUIRED=true
NEXT_PUBLIC_BETA_ONBOARDING_CALENDLY_URL=https://calendly.com/your-link
```

Each invite code:

- Expires after 30 days if unused.
- Can be tied to a specific email address.
- Marks the user as `pro` when claimed.
- Sets `access_expires_at` to three months after claim.
- Can be marked VIP for extra-careful onboarding.

The current implementation grants Pro access by updating `profiles.role = 'pro'`.
Before the first beta cohort expires, add a scheduled downgrade job or review
`beta_invites.access_expires_at` manually.

## Feedback Flow

Active beta users see a persistent "Beta feedback" widget in authenticated app
routes. Feedback is stored in `beta_feedback` with:

- category
- severity
- current page URL
- optional 1-5 rating
- optional attachment path
- status

Admins triage feedback at `/admin/beta/feedback` using:

- New
- Reviewing
- Planned
- In progress
- Done
- Won't fix

## Weekly Iteration Loop

Every Friday during beta:

1. Review new Sentry issues, support tickets, and `beta_feedback`.
2. Tag each feedback item as planned or won't fix.
3. Identify launch blockers: P0/P1 bugs, activation confusion, billing or auth failures.
4. Ship fixes that improve activation and reliability.
5. Send a weekly beta update: what shipped, what was heard, what is next.

## Qualitative Schedule

- Week 1: Interview the first 10 beta users for 30 minutes.
- Week 2: Send a 10-question async survey to all beta users.
- Week 3: Interview 5 active users and 5 inactive users.
- Week 4: Ask NPS and "What would make you tell a friend?"

## Quantitative Metrics

Track these in PostHog and admin dashboards:

- Activation rate within 7 days
- Day 1, Day 7, Day 14, and Day 30 retention
- Feature adoption for Copilot, tools, templates, community, and Mini-HRIS
- Time to first useful action
- Error rate and failed generation rate

## Kill Criteria

Do not launch publicly until these are addressed:

- Activation below 30%
- NPS below 20
- Week-1 churn above 50%
- Open P0 bugs
- Sign-up, billing, support, or generation failures that cannot be fixed quickly

A delayed launch is better than teaching the market not to trust the product.
