# Runbook: Database Slow Or Unavailable

## Symptoms

- `/api/health` returns degraded or 503.
- Dashboard, tools, community, or admin pages time out.
- Supabase query insights show slow queries or high connection usage.
- Sentry reports database request failures.

## Immediate Actions

1. Open Supabase project dashboard.
2. Check database health, connection count, CPU, memory, and query insights.
3. Check whether a single query is dominating latency.
4. Check Vercel function logs for route-specific failures.
5. If the app is broadly degraded, update status page.

## Triage

- One slow query: add an index or reduce selected columns.
- High connection usage: review function concurrency and PgBouncer settings.
- Table lock: identify long-running transaction and terminate if safe.
- Supabase incident: follow provider status and communicate externally.

## Resolution

- Add targeted indexes for queries over 100ms.
- Replace `select("*")` in hot paths with explicit columns.
- Batch related reads with `Promise.all`.
- Move invariant data to module-level constants or cached functions.
- Scale Supabase plan if launch traffic exceeds current limits.

## Follow-Up

- Add query regression notes to `docs/perf-baseline.md`.
- Add alerts for repeat query patterns.
