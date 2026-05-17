# Manual Supabase Migrations To Run

Run these in the Supabase SQL Editor in this order if your database is missing feature tables such as `benefit_plans`, `job_referrals`, `lms_courses`, `exit_records`, or `org_integrations`.

## Core app support

1. `supabase/migrations/0016_granular_roles.sql`
2. `supabase/migrations/0018_document_compliance.sql`
3. `supabase/migrations/0019_employee_portal.sql`
4. `supabase/migrations/0020_approval_workflows.sql`
5. `supabase/migrations/0021_lifecycle_workflows.sql`
6. `supabase/migrations/0022_activity_log.sql`
7. `supabase/migrations/0030_workflow_runs.sql`

## HR feature modules

8. `supabase/migrations/20260515_sprint3_payroll_performance_surveys.sql`
9. `supabase/migrations/20260515_sprint4_recruiting_onboarding_time.sql`
10. `supabase/migrations/20260515_sprint5_policy_library.sql`
11. `supabase/migrations/20260516_assets.sql`
12. `supabase/migrations/20260516_benefits.sql`
13. `supabase/migrations/20260516_disciplinary.sql`
14. `supabase/migrations/20260516_exit_management.sql`
15. `supabase/migrations/20260516_integrations.sql`
16. `supabase/migrations/20260516_learning.sql`
17. `supabase/migrations/20260516_referrals.sql`
18. `supabase/migrations/20260516_succession.sql`

## Optional commercial/platform support

19. `supabase/migrations/0023_business_tier_pricing.sql`
20. `supabase/migrations/0024_sales_enterprise.sql`
21. `supabase/migrations/0025_phase_d_audit_support.sql`
22. `supabase/migrations/0026_atomic_usage_tracking.sql`
23. `supabase/migrations/0027_retention_override.sql`
24. `supabase/migrations/0028_community_votes_cascade.sql`
25. `supabase/migrations/0029_mentorship_waitlist.sql`

## After running

Open Supabase SQL Editor and run:

```sql
notify pgrst, 'reload schema';
```

Then refresh the app and try `Load demo data` again.
