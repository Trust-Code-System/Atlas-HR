# Atlas HR

Atlas HR is a multi-country people operations platform for employee onboarding, payroll workflows, compliance, documents, and AI-assisted HR work.

[Open the live application](https://atlas-hr-fq24.vercel.app)

## Core capabilities

- Role-based workspaces for employees, managers, and administrators
- Employee records, onboarding, leave, documents, and payroll workflows
- Country-aware HR and compliance support for Nigeria, India, the United Kingdom, and the United States
- AI-assisted policy, document, and people operations workflows
- Email delivery, billing, product analytics, rate limiting, and error monitoring
- Automated accessibility and browser testing

## Architecture

Atlas HR is a Next.js 16 application backed by Supabase. Server-side integrations include OpenAI, Anthropic, Stripe, Resend, Sentry, PostHog, and Upstash Redis. Database changes are versioned as Supabase migrations.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The application validates its configuration through `src/lib/env.ts`. Provision the required Supabase and service credentials in a local environment file before exercising integrated features. Never commit real secrets.

## Verification

```bash
npm run lint
npm run build
npx vitest run
npm run test:contrast
```

The contrast audit currently serves as a tracked accessibility baseline and publishes a Playwright report in GitHub Actions.

## Operations

- Product and engineering documentation: [`docs/`](docs/)
- Database migration guidance: [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md)
- Pre-launch checks: [`docs/pre-launch-checklist.md`](docs/pre-launch-checklist.md)
- Production runbook: [`docs/runbook.md`](docs/runbook.md)

Atlas HR is maintained by [TrustCode Systems](https://trustcodesystem.tech/).
