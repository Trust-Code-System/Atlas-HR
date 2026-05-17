# Migration Sequence

This file maps blueprint phase references to actual migration files. Migration
numbers drifted from spec because three unplanned migrations were inserted
mid-sequence (template storage, billing feedback, consent retention), shifting
all Phase D and E files by 1–2 positions.

## Phase A — Backend Foundation

| Blueprint ref | Actual file | Notes |
|---|---|---|
| 0001_initial_schema | 0001_initial_schema.sql | ✓ 15 tables |
| 0002_rls_policies | 0002_rls_policies.sql | ✓ RLS for all 15 tables |
| 0003_storage | 0003_storage.sql | ✓ avatars bucket |
| 0004_notification_prefs | 0004_notification_prefs.sql | ✓ |
| 0005_community_functions | _(merged into 0001)_ | Community triggers live in initial schema |
| 0006_invites | 0006_invites.sql | ✓ org_invites table |
| 0007_retention_cleanup | 0007_retention_cleanup.sql | ✓ pg_cron cleanup |

## Phase B — Content

| Blueprint ref | Actual file | Notes |
|---|---|---|
| 0008_content_feedback | 0008_content_feedback.sql | ✓ |
| _(unplanned)_ | 0009_template_storage.sql | Template file storage bucket, added during Phase B |

## Phase C — Monetisation

| Blueprint ref | Actual file | Notes |
|---|---|---|
| 0009_stripe | 0010_stripe.sql | Shifted +1 by template storage insertion |
| _(unplanned)_ | 0011_billing_feedback.sql | Cancellation feedback table, added during Phase C |
| 0010_emails | 0012_emails.sql | Shifted +2 |
| 0011_user_devices | 0013_user_devices.sql | Shifted +2 |
| _(unplanned)_ | 0014_consent_retention.sql | Cookie consent + retention functions, added during Phase C.12 |

## Phase D — Launch Readiness

| Blueprint ref | Actual file | Notes |
|---|---|---|
| 0012_admin_audit + 0013_support | 0025_phase_d_audit_support.sql | Consolidated into single late migration |
| 0014_beta | 0015_beta.sql | Shifted +1 |

## Phase E — HRIS

| Blueprint ref | Actual file | Notes |
|---|---|---|
| 0015_granular_roles | 0016_granular_roles.sql | Shifted +1 |
| 0016_scheduled_reports | 0017_scheduled_reports.sql | Shifted +1 |
| 0017_document_compliance | 0018_document_compliance.sql | Shifted +1 |
| 0018_employee_links | 0019_employee_portal.sql | Renamed; shifted +1 |
| 0019_approval_workflows | 0020_approval_workflows.sql | Shifted +1 |
| 0020_lifecycle_workflows | 0021_lifecycle_workflows.sql | Shifted +1 |
| 0021_activity_log | 0022_activity_log.sql | Shifted +1 |
| _(unplanned)_ | 0023_business_tier_pricing.sql | Business tier plan constraints, added during Phase E.8 |
| 0022_sales | 0024_sales_enterprise.sql | Renamed; shifted +2 |
| _(Phase D consolidation)_ | 0025_phase_d_audit_support.sql | admin_audit_log + support_tickets (D.4 + D.5) |
| _(unplanned)_ | 0030_workflow_runs.sql | Generic workflow bundle runs for workflow library launch actions |

## Adding new migrations

1. Use the next available number (currently 0031).
2. Add an entry to this file mapping it to its spec reference (or marking it unplanned).
3. Name format: `NNNN_short_description.sql` — lowercase, underscores, no spaces.
4. If the migration is destructive or data-modifying on a live database, add a rollback comment at the top of the SQL file.
