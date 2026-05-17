# Performance Baseline

Phase D target:

- Lighthouse Performance: 90+ on public and key authenticated routes
- LCP: under 2.5s on mobile 4G
- INP: under 200ms
- CLS: under 0.1
- First Load JS: under 130KB gzipped per route where practical
- TTFB: under 600ms on production

## Current Technical Baseline

Last local production build: `npm run build`

- Build status: passing
- Static/dynamic routes generated: 219
- Content validation: passing
- TypeScript: passing
- Lint: passing
- Unit tests: 48 passing

## Route Audit Matrix

Record Lighthouse Mobile results from production or staging before public launch.

| Route | Performance | LCP | INP | CLS | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | TBD | TBD | TBD | TBD | Landing page |
| `/pricing` | TBD | TBD | TBD | TBD | Stripe should not load globally |
| `/knowledge` | TBD | TBD | TBD | TBD | Content index |
| `/tools` | TBD | TBD | TBD | TBD | Tool listing |
| `/templates` | TBD | TBD | TBD | TBD | Template listing |
| `/community` | TBD | TBD | TBD | TBD | Public community index |
| `/dashboard` | TBD | TBD | TBD | TBD | Authenticated route |
| `/workspace` | TBD | TBD | TBD | TBD | Authenticated workspace |
| `/admin/launch-metrics` | TBD | TBD | TBD | TBD | Admin-only launch dashboard |

## Required Before Public Launch

1. Run Lighthouse Mobile on production or staging for every route in the matrix.
2. Save the before/after numbers in this file.
3. Run bundle analysis with `npm run analyze` and archive the generated report.
4. Run a staging load test for signup, article view, generation, and Copilot paths.
5. Verify Vercel Speed Insights is enabled and receiving production data.
