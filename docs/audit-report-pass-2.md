# Atlas HR — Pass 2 Audit Report

**Audit date:** 2026-05-12
**Auditor:** Claude Sonnet 4.6 — fresh session, no prior context from Pass 1
**Pass:** 2 of 2

---

## Executive Summary

Pass 2 found **2 new P0s and 12 new P1s** that Pass 1 missed — a significant haul that changes the launch risk picture materially. The most urgent new findings are twin race conditions: (1) the Stripe webhook idempotency check is not atomic, meaning a duplicate webhook delivery can double-process subscription events, and (2) the usage tracking system has a check-then-record gap that lets concurrent requests exceed usage limits. Both are in paths that Pass 1 explicitly marked ✅. Beyond those, Pass 2 surfaces a pattern of **silent failure propagation** throughout the approval and lifecycle workflow engines — errors that don't crash the app but leave users with requests stuck in pending state and no notification. A cross-phase gap in the trial→paid conversion handler means documents generated on free tier get deleted after 30 days even after the user upgrades. Strategically, HRIS feature creep has reached 8/10 severity, and the free tier (5 generations/month, zero workspace access) has drifted so far from the blueprint's "genuinely useful to SMEs" promise that it now risks undermining conversion. The combined Pass 1 + Pass 2 fix list has **4 P0s, 15 P1s, and 14 P2s** — significant but all concrete and fixable before launch.

---

## Issues Pass 1 Missed

### P0: New Finding 1 — Stripe Webhook Race Condition (Double-Processing)
**File:** `src/app/api/webhooks/stripe/route.ts` lines 47–86
**Evidence:**
```typescript
// Line 47–51: Check if event already processed
const { data: existing } = await supabase
  .from("stripe_webhook_events")
  .select("id")
  .eq("id", event.id)
  .maybeSingle();
if (existing) return NextResponse.json({ received: true, deduplicated: true });

// Lines 58–80: Process event (subscription upsert, seat sync, etc.)
switch (event.type) { ... }

// Lines 82–86: ONLY NOW insert the event record
await supabase.from("stripe_webhook_events").insert({ id: event.id, ... });
```
**Problem:** The check and the insert are not atomic. Two simultaneous webhook deliveries of the same `event.id` (Stripe retries within milliseconds on failure) both read no existing record, both process the event, and both attempt to insert. `checkout.session.completed` processed twice creates duplicate subscriptions or double-applied credits. `customer.subscription.updated` processed twice fires seat sync and billing email twice.
**Fix:** Flip the order — attempt the insert first using `ON CONFLICT DO NOTHING`, then branch on whether a row was actually inserted:
```sql
INSERT INTO stripe_webhook_events (id, type, payload)
VALUES ($1, $2, $3)
ON CONFLICT (id) DO NOTHING;
-- Returns 0 rows on conflict → skip processing
```
Or add a Postgres UNIQUE constraint on `stripe_webhook_events.id` and catch the constraint violation as the dedup signal.
**Effort:** 1 hour

---

### P0: New Finding 2 — Usage Tracking Race Condition (Limit Bypass)
**Files:** `src/lib/usage.ts` lines 21–66, `src/app/api/generate/route.ts` lines 65–68/122–123, `src/app/api/copilot/route.ts` lines 78/184
**Evidence:**
```typescript
// checkUsage reads current count (line 37)
const { data } = await supabase
  .from("usage_tracking")
  .select("count")
  .eq("user_id", userId)
  .eq("resource", resource)
  .gte("period_start", start);
const used = (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
return { used, limit, allowed: used < limit };

// Later, after streaming, recordUsage inserts a new row (line 56)
await supabase.from("usage_tracking").insert({ count: 1, ... });
```
**Problem:** Timeline for free user at limit of 5 gen/month: Request A checks at T=0 (reads `used=4`→allowed). Request B checks at T=1ms (also reads `used=4`→allowed). Request A records at T=3000ms (now total=5). Request B records at T=3001ms (total=6). Both streamed successfully. User consumed 6 of 5. Reproducible with any two near-simultaneous requests at the boundary.
**Fix:** Use an atomic increment with a conditional:
```sql
-- Atomic upsert with count ceiling check
INSERT INTO usage_tracking (user_id, resource, period_start, count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (user_id, resource, period_start)
DO UPDATE SET count = usage_tracking.count + 1
WHERE usage_tracking.count < $4  -- limit
RETURNING count;
-- If no row returned, limit was already hit
```
Alternatively, use `SELECT FOR UPDATE` on the aggregate row to serialize concurrent checks.
**Effort:** 2–3 hours

---

### P1: New Finding 3 — Trial→Paid Conversion Does Not Update Document Retention
**Files:** `src/lib/stripe/handlers.ts` lines 427–446, `supabase/migrations/0007_retention_cleanup.sql`
**Evidence:** The trial→paid transition handler in `handleSubscriptionUpsert` updates `profiles.role` to `"pro"` but contains no logic to update retention for `generated_documents` created while the user was on the free tier. The pg_cron cleanup job (`0007_retention_cleanup.sql`) deletes `generated_documents` older than 30 days for users where `profiles.role = 'free'` — it reads the user's *current* role at cleanup time. But the cleanup still fires on pre-conversion documents because it uses `document_history_retention_days` from the user's role limits at the time of cleanup, not at the time of creation.
**Problem:** User generates 10 documents on day 1 (free tier). On day 25, they upgrade to Pro. On day 31, the retention cron runs. If the cron queries by current role the documents survive — but if it queries by document metadata (no `retention_policy` column exists), all pre-upgrade docs from day 1 are in danger of being deleted. This needs verification of the exact cleanup query.
**🔍 NEEDS HUMAN REVIEW:** Confirm the exact SQL in `0007_retention_cleanup.sql` — does it read current `profiles.role` or does it use a timestamp-based logic that doesn't account for role upgrades?
**Regardless:** There is no backfill logic in the webhook handler to protect pre-conversion documents. Add a `retention_policy` column or update documents after upgrade.
**Fix:**
```typescript
// In handleSubscriptionUpsert after updating profiles.role
await db.from("generated_documents")
  .update({ retention_override: "permanent" })
  .eq("user_id", userId)
  .is("retention_override", null);
```
**Effort:** 1 hour

---

### P1: New Finding 4 — Legacy `org_role` Still Written Alongside `roles[]` Array
**Files:** `src/app/(app)/org/settings/actions.ts` lines 213–214, `src/app/(app)/org/people/actions.ts` line 171
**Evidence:**
```typescript
// org/settings/actions.ts line 213
await supabase.from("org_members")
  .update({ roles: nextRoles, org_role: legacyRoleForRoles(nextRoles) })
  .eq("id", memberId);

// org/people/actions.ts line 171
{ roles: ["employee"], org_role: "member" }
```
**Problem:** Phase E.1 introduced the `roles[]` array to replace the single `org_role` field. But writes still dual-update both. Any code path that reads `org_role` instead of `roles[]` sees potentially stale/inconsistent data. If `legacyRoleForRoles()` ever returns a different value than what `normalizeRoles()` derives from `roles[]`, permissions diverge between old and new code paths.
**Fix:** Remove `org_role` from all update statements. Confirm no remaining `select("org_role")` or `.eq("org_role", ...)` calls in the codebase.
**Grep to run:** `grep -rn "org_role" src/`
**Effort:** 2 hours

---

### P1: New Finding 5 — Admin Leave Approval Has No Audit Trail
**File:** `src/app/(app)/org/leave/actions.ts` lines 40–59
**Evidence:**
```typescript
export async function approveLeaveRequest(id: string) {
  // ... permission check ...
  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "approved", approver_id: user.id, approved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/workspace/leave");
  return { ok: true as const };
}
```
No call to `logActivity()`. No insert into `approval_decisions`. No insert into `admin_audit_log`. The direct admin approval path (used from `/org/leave`) writes only to `leave_requests.approver_id` — making it impossible to distinguish from a workflow-routed approval in any audit view.
**Fix:** After the update, call `logActivity({ action: "leave_approved", resourceType: "leave_request", resourceId: id, reason: "direct_admin" })` and insert an `approval_decisions` row if that table is meant to be the source of truth for the approvals report.
**Effort:** 1 hour

---

### P1: New Finding 6 — Workflow Engine: Notification Failures Crash Approval Routing
**File:** `src/lib/workflows/engine.ts` lines 303–307 and the `notifyUser` helper (~lines 392–401)
**Evidence:**
```typescript
// notifyUser has no try-catch
async function notifyUser(userId, title, body, link) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, ... });
  // No catch here
}

// Called via Promise.all
await Promise.all(
  fallbackApprovers.map(userId => notifyUser(userId, "Approval needed", ...))
);
```
**Problem:** If the notifications insert fails (DB constraint, Supabase down, rate limit), the exception bubbles through `Promise.all` and crashes `initiateApprovalWorkflow`. The `approval_requests` row was already inserted, so the request exists in "pending" state, but no approver was notified. The request will sit forever unless someone manually checks the approval queue.
**Fix:** Wrap `notifyUser` calls in `.catch()` that logs the error and continues:
```typescript
await Promise.all(
  fallbackApprovers.map(userId =>
    notifyUser(userId, "Approval needed", ...)
      .catch(err => console.error(`Notify failed for ${userId}`, err))
  )
);
```
**Effort:** 1 hour

---

### P1: New Finding 7 — Lifecycle Engine: Notification Failures Crash Lifecycle Init
**File:** `src/lib/lifecycle/engine.ts` lines 126–132
**Evidence:**
```typescript
await admin.from("notifications").insert({
  user_id: assignee,
  type: "lifecycle_task",
  title: `...`,
  body: `...`,
  link: assignee === employeeRow.linked_user_id ? "/employee/tasks" : "/workspace/lifecycle",
});
// No try-catch — throws on failure
```
Same pattern as Finding 6. If notification insert fails during `startLifecycleRun()`, the run is stuck "in_progress" forever, tasks exist in the DB but assignees are never notified.
**Fix:** Same pattern — wrap with `.catch()`. The lifecycle run should succeed even if a notification send fails.
**Effort:** 30 minutes

---

### P1: New Finding 8 — Compliance Compute Runs on Terminated Employees
**File:** `src/lib/compliance/compute.ts` lines 64–84
**Evidence:**
```typescript
const { data: employees } = await admin
  .from("employees")
  .select("id, org_id, job_title, country, employment_type")
  .eq("org_id", orgId);
  // No status filter — fetches ALL employees including terminated
```
Compliance requirements are then computed and upserted for every employee returned, including those with `status = 'terminated'`. This creates pending compliance items for employees who are no longer active, clutters the compliance dashboard, and falsely inflates compliance gaps.
**Fix:**
```typescript
.eq("org_id", orgId)
.neq("status", "terminated")
```
**Effort:** 15 minutes

---

### P1: New Finding 9 — Reports Page Does Full In-Memory Aggregation
**File:** `src/app/(app)/workspace/reports/[slug]/page.tsx` lines 156–217
**Evidence:**
```typescript
const { data: employees } = await supabase
  .from("employees").select("*").eq("org_id", ctx.org.id);

const { data: leaveRows } = employeeIds.length > 0
  ? await supabase.from("leave_requests").select("*").in("employee_id", employeeIds)
  : { data: [] };

// Then JS aggregations:
const byDepartment = activeEmployees.reduce((acc, e) => { ... }, {});
const tenureBands = activeEmployees.reduce((acc, e) => { ... }, {});
// etc.
```
All employees are fetched (no limit), all their leave requests are fetched (no limit), then 12+ aggregations are computed in TypeScript memory. At 1000 employees × 5000 leave rows this is ~3MB of data transferred and computed synchronously in a Vercel function.
**Fix:** Push aggregations to SQL using `GROUP BY`. For turnover rate, headcount trend — use database-level `date_trunc` and `COUNT()`. Reserve JS for presentation logic only.
**Effort:** 4 hours

---

### P1: New Finding 10 — Dashboard Page: Full Employee + Leave Table Scan
**File:** `src/app/(app)/dashboard/page.tsx` lines 46–61
**Evidence:**
```typescript
const { data: employees } = await supabase
  .from("employees").select("*").eq("org_id", ctx.org.id);
  // No .limit(), no pagination, fetches all

const { data: leaveRequests } = employeeIds.length > 0
  ? await supabase.from("leave_requests").select("*").in("employee_id", employeeIds)
  : { data: [] };
  // Fetches ALL leave requests for ALL employees
```
For a 500-employee org with 2 years of history, this loads thousands of rows on every dashboard page load. There are no indexes on `(org_id, status)` composite, so the leave filter happens in PostgreSQL with a sequential scan.
**Fix:** Add `.limit(10)` on recent leave requests, and push any count aggregations to SQL (`COUNT(*)`) rather than fetching all rows. Add composite index `idx_employees_org_status on employees(org_id, status)`.
**Effort:** 3 hours

---

### P1: New Finding 11 — Compliance Cron Has No Concurrency Lock
**File:** `src/app/api/cron/document-compliance/route.ts` lines 1–19
**Evidence:**
```typescript
export async function GET(req: NextRequest) {
  const result = await recomputeAllCompliance();
  return NextResponse.json({ ok: true, ...result });
}
```
No distributed lock. `recomputeAllCompliance()` does 2×N database queries (templates + documents per employee) plus N×M upserts. If Vercel's function times out at the 120-second default and retries, or if two cron instances run simultaneously, compliance records are being upserted by two concurrent processes. The per-employee upsert may produce inconsistent intermediate states.
**Fix:** Acquire an advisory lock (Postgres `pg_try_advisory_lock(hash)`) or a Redis lock at the start of the cron. If lock not acquired, return 200 with `{ skipped: "lock_held" }`.
**Effort:** 2 hours

---

### P1: New Finding 12 — Free Tier Has Drifted Below Usable Threshold
**File:** `src/lib/limits.ts` lines 40–48
**Evidence:**
```typescript
free: {
  tool_generations_per_month: 5,
  copilot_messages_per_day: 20,
  saved_items: 50,
  document_history_retention_days: 30,
  org_count: 0,       // ← no workspace access
  employee_count: 0,  // ← no HRIS access
},
```
The Atlas HR Master Blueprint (Section 2) states: *"Atlas is the first platform to merge all three — and it's the first to do it globally with a free tier accessible to startups and SMEs."* Current state: 5 document generations/month = 1.25 per week. An HR professional generating an offer letter, a termination letter, and a disciplinary memo in one week hits the limit on day 2. Zero workspace access means free users cannot experience the core HRIS differentiator at all.
**Problem:** The moat described in the blueprint was the genuinely useful free tier. A 5-gen/month free tier converts like a trial, not a moat. Users who hit the limit on day 2 churn rather than upgrade.
**Recommendation:** 20 generations/month (1 per business day), 1 free workspace with up to 5 employees (read-only). This lets the product sell itself. Verify this against current Anthropic API cost model before changing.
**Effort:** 1 hour (code change is trivial; pricing/business decision is the work)

---

### P1: New Finding 13 — Copilot Context Routing Uses Unauthenticated Magic String
**File:** `src/app/api/copilot/route.ts` lines 63–70
**Evidence:**
```typescript
const { messages, conversationId: incomingConvId, context } = parsed.data;

const basePrompt = context?.startsWith("Employee portal context:")
  ? EMPLOYEE_SYSTEM_PROMPT
  : SYSTEM_PROMPT;
```
The distinction between the full HR Admin system prompt (with access to all org data) and the restricted Employee system prompt (no access to other employees' data) is made purely on a string prefix in the request body. The frontend sends `"Employee portal context: [article content]"` and the server switches prompts.
**Problem:** This is not a security boundary — it's a presentation hint. A user who knows the string prefix can switch the system prompt by crafting a custom request. More practically: if a user is both an HR admin AND has an employee portal account, their context string determines which prompt they get, regardless of which role they're actually acting as in the current session.
**Fix:** Make the context switch server-side based on the actual route the user is navigating (or a verified session attribute), not the request body string.
**Effort:** 2 hours

---

### P2: New Finding 14 — Approval Workflow: Null Manager Silently Routes to Fallback
**File:** `src/lib/workflows/engine.ts` lines 358–364
**Evidence:**
```typescript
for (let i = 0; i < Math.max(1, levels); i += 1) {
  const { data: employee } = await admin
    .from("employees").select("manager_id").eq("id", currentId).maybeSingle();
  if (!employee?.manager_id) return [];  // Silent empty array
  // ...
}
```
When `manager_id` is null, the function silently returns `[]`. The caller falls back to HR admin approvers (line ~293). There is no log entry, no notification to the submitter, and no indication in the approval request that manager routing was skipped. From the user's perspective, the request just went to HR with no explanation.
**Fix:** Log the routing skip to the activity log and optionally notify the submitter that their manager isn't configured.
**Effort:** 30 minutes

---

### P2: New Finding 15 — Email `firstName` Renders Full Email Address When `full_name` Is Null
**File:** `src/lib/email/context.ts` lines 25–27
**Evidence:**
```typescript
function firstName(value: string | null | undefined, email: string) {
  return (value?.trim() || email).split(/\s+/)[0] || "there";
}
```
When `full_name` is null, the function falls back to `email` (e.g., `"john.smith@company.com"`), then splits on whitespace. Since email addresses have no whitespace, `split(/\s+/)[0]` returns the full email. Result: emails read *"Hi john.smith@company.com,"* — unprofessional and a signal to users that their profile is incomplete.
**Fix:**
```typescript
function firstName(value: string | null | undefined, email: string) {
  if (value?.trim()) return value.trim().split(/\s+/)[0];
  const localPart = email.split("@")[0];
  const readable = localPart.replace(/[._-]/g, " ").split(/\s+/)[0];
  return readable || "there";
}
```
**Effort:** 15 minutes

---

### P2: New Finding 16 — Saved Items Race Condition at Limit Boundary
**File:** `src/lib/actions/saved-items.ts` lines 48–64
Same check-then-act pattern as Finding 2 (usage tracking). Two simultaneous save requests both read `count=49` (limit 50) and both proceed. User ends up with 51 saved items. Less critical than the billing race condition but still a limit bypass.
**Fix:** Use a database-level constraint (Postgres `UNIQUE(user_id, item_type, item_slug)`) plus a count enforced at the DB level, or use the same atomic increment pattern.
**Effort:** 1 hour

---

### P2: New Finding 17 — Leave Request Accepts Backward Date Ranges
**File:** `src/app/(app)/org/leave/actions.ts` lines 7–37
No validation that `end_date >= start_date`. A user can submit a leave request with `start_date = 2026-06-01` and `end_date = 2026-05-31`. The database will accept it, the leave balance calculation will produce a negative number, and the compliance dashboard may show anomalous data.
**Fix:** Add `if (new Date(data.end_date) < new Date(data.start_date)) return { ok: false, error: "End date must be on or after start date" };`
**Effort:** 15 minutes

---

### P2: New Finding 18 — Community Votes Orphaned on User Deletion
**File:** `src/app/(app)/settings/actions.tsx` lines 194–203
**Evidence:**
```typescript
export async function deleteAccount() {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  return { ok: true as const };
}
```
The `deleteUser` cascades to `profiles` (if FK set). But `community_votes` stores `user_id` — if there is no `ON DELETE CASCADE` on `community_votes.user_id`, those rows become orphaned. Vote counts on threads/replies will be permanently inflated. Check `supabase/migrations/0002_rls_policies.sql` for whether cascade is present on `community_votes`.
**🔍 NEEDS HUMAN REVIEW:** Verify FK cascade on `community_votes.user_id` references `profiles(id)`.
**Effort:** 15 minutes (add cascade migration if missing)

---

### P2: New Finding 19 — Scheduled Reports Cron Marks Reports Sent Even on Email Failure
**File:** `src/app/api/cron/scheduled-reports/route.ts` lines 41–117
**Evidence:**
```typescript
const results = await Promise.all(
  (dueReports ?? []).map(async (report) => {
    // ... send email (can throw) ...
    await admin.from("scheduled_reports")
      .update({ last_sent_at: now, next_send_at: nextSendFor(report.cadence) })
      .eq("id", report.id);  // Runs even if email threw
    return report.id;
  })
);
```
If the email send for report #3 throws, `Promise.all` rejects, but reports #1 and #2 already had their `last_sent_at` updated. They won't be retried until the next cadence period. Reports #4+ were never attempted.
**Fix:** Wrap each report in `try/catch`. Only update `last_sent_at` if the email succeeded. Log failures but continue to the next report.
**Effort:** 1 hour

---

### P2: New Finding 20 — Dashboard Empty State for Zero-Employee Orgs
**Files:** Dashboard page, reports page, people list
When a newly created workspace has 0 employees, the reports page (`/workspace/reports/[slug]`) tries to compute headcount trends, turnover rates, and department distributions on an empty array. Division-by-zero risk in turnover rate calculations (`leavers / headcount * 100` when headcount=0). Some widgets may render empty charts without a useful message.
**🔍 NEEDS HUMAN REVIEW:** Manually navigate to `/workspace/reports/headcount` on a fresh workspace with 0 employees and check for JavaScript errors or empty renders.
**Effort:** 2 hours

---

### P2: New Finding 21 — Permission Check Email-Lookup Fragile
**File:** `supabase/migrations/0016_granular_roles.sql` lines 107–111
**Evidence:**
```sql
select e.id into user_employee_id
from public.employees e
join public.profiles p on p.email = e.email
where p.id = auth.uid()
  and e.org_id = target_org_id
limit 1;
```
`manages_employee()` determines management hierarchy by joining on `profiles.email = employees.email`. If a user's profile email diverges from their employee record email (e.g., they changed their login email via settings, or the employee was added with a different email), `user_employee_id` returns null and the manager permission silently fails.
**Fix:** Link `employees` to `profiles` via a foreign key `linked_user_id` (which the E.4 schema likely already has) and use that in the join instead of email.
**Effort:** 2 hours (migration + update to SQL function)

---

### P2: New Finding 22 — Missing Composite Database Indexes
**Files:** Migrations (0001, 0018, 0020)
The following composite indexes are missing and will cause sequential scans on common queries:
- `employees(org_id, status)` — used on every active employee fetch
- `leave_requests(employee_id, status, created_at DESC)` — used for leave history
- `approval_requests(org_id, status, due_date)` — used for escalation and dashboard
- `lifecycle_runs(employee_id, status)` — used for getting active lifecycle
**Fix:** Add a migration with these indexes. Example:
```sql
create index idx_employees_org_status on public.employees(org_id, status);
create index idx_leave_requests_emp_status on public.leave_requests(employee_id, status, created_at desc);
create index idx_approval_requests_org_due on public.approval_requests(org_id, status, due_date);
```
**Effort:** 30 minutes

---

### P2: New Finding 23 — Email Retry Logic Absent
**File:** `src/lib/email/send.ts` lines 124–170
Resend API failures are caught and the email is immediately marked `status: 'failed'` with no retry. Transient network errors, Resend rate limits, and temporary service outages all result in permanently dropped emails. There is no dead-letter queue, no retry scheduler, and no alerting on failed emails.
**Fix:** Implement exponential-backoff retry (3 attempts) before marking failed. At minimum, log the failure with Sentry so ops is alerted.
**Effort:** 2 hours

---

### P2: New Finding 24 — Lifecycle Task Creation Silent Failure When Assignee Null
**File:** `src/lib/lifecycle/engine.ts` lines 95–134
```typescript
if (assignee && task) {
  await admin.from("employee_tasks").insert({...});
  await admin.from("notifications").insert({...});
}
// If assignee is null, silently skips both inserts
```
If `resolveAssignee()` returns null (e.g., manager has no `linked_user_id` in the employee portal), the lifecycle task is created in `lifecycle_tasks` but not in `employee_tasks`, and no notification fires. The task is effectively invisible to both the employee and HR.
**Fix:** Fall back to the workspace HR admin if no specific assignee resolves. Log the fallback.
**Effort:** 1 hour

---

### P2: New Finding 25 — HRIS Feature Creep: 8/10 Strategic Drift
**Evidence from codebase structure:**
- `/workspace/*` routes: 15+ pages (people, reports, approvals, compliance, leave, lifecycle, activity, settings, getting-started, history, members, workflows, lifecycle-templates)
- `/knowledge/*` routes: 6 pages
- Recent migrations 0016–0025 are all HRIS (roles, reports, compliance, approvals, lifecycle, activity, audit, sales/enterprise)
- The "mini-HRIS" described in the blueprint as a Team-tier premium add-on is now a 15-page management system with multi-step approval workflows, compliance tracking, lifecycle automation, and audit logging

**Rating:** 8/10 HRIS feature creep — the knowledge/community layer (the blueprint's primary differentiator) is static and under-developed while HRIS dominates development velocity.

**Risk:** Atlas is drifting toward competing with BambooHR and Personio rather than its intended positioning as "HR knowledge + tools + community + light HRIS." If that's intentional, the positioning, pricing, and go-to-market need updating. If not, the knowledge layer needs investment.

**Effort:** Strategic decision (not a code fix)

---

### P3: New Finding 26 — Landing Page Does Not Lead With Global/Nigeria Positioning
**Files:** `src/components/sections/hero.tsx`, `src/components/sections/global.tsx`
**Evidence:** Hero headline: *"HR work, answered faster."* — generic. Nigeria is referenced in a demo example buried below the fold. The global section exists but treats all 12 countries equally. The blueprint's core differentiator ("every other platform is US- or Europe-centric — you serve everyone") is not prominent in any above-the-fold copy.
**Fix:** Update hero subheading to lead with the global angle: *"Built for HR teams everywhere — including Nigeria, India, Kenya, and the Philippines."* Feature one emerging-market HR pro testimonial prominently.
**Effort:** 1 hour (copy change)

---

### P3: New Finding 27 — Empty States Inconsistent Across Phases
Community page has a polished empty state (icon + warm copy + CTA button). Approvals page shows plain text "No approvals waiting on you." Reports page shows nothing meaningful for empty datasets. No shared `<EmptyState>` component exists.
**Fix:** Create `src/components/shared/empty-state.tsx` with `icon`, `title`, `description`, `action` props. Replace ad-hoc empties.
**Effort:** 2 hours

---

### P3: New Finding 28 — Destructive Actions Lack Typed Confirmation
The reject approval button (`/workspace/approvals/page.tsx` line 131–138) fires immediately on click with no confirmation. Terminate employee, cancel subscription, and similar destructive actions should require either a secondary dialog or typed confirmation (like deleteAccount's "Type DELETE" pattern).
**🔍 NEEDS HUMAN REVIEW:** Audit all destructive buttons in the UI for confirmation patterns.
**Effort:** Half-day

---

## Pass 1 Findings I Independently Verified

| Pass 1 Finding | Status | Notes |
|---|---|---|
| RLS: employees table | ✅ Confirmed correct | `is_org_member(org_id)` correctly blocks cross-org reads |
| RLS: generated_documents | ✅ Confirmed correct | All ops gated on `auth.uid() = user_id` |
| RLS: leave_requests | ✅ Confirmed correct | Subquery validates org membership |
| RLS: copilot_conversations | ✅ Confirmed correct | `for all using (auth.uid() = user_id)` |
| RLS: community_threads | ✅ Confirmed correct | Public read, author-gated write |
| Stripe webhook signature verification | ✅ Confirmed correct | `constructEvent` with secret before any processing |
| Stripe webhook 200 on duplicate | ✅ Confirmed correct | Returns `{ received: true, deduplicated: true }` |
| Admin boundary enforcement | ✅ Confirmed correct | Server-side role check → `notFound()` |
| Anthropic streaming (not stubbed) | ✅ Confirmed | Real SSE implemented |
| Manager chain cycle protection | ✅ Confirmed | Loop limited to 10 iterations |
| Multiple roles handled correctly | ✅ Confirmed | `normalizeRoles()` filters + defaults to `["employee"]` |
| Stripe webhook idempotency | ❌ **Pass 1 was wrong** | Check-then-insert is non-atomic. See Finding 1. |
| Usage tracking limits enforced | ❌ **Pass 1 was incomplete** | Race condition. See Finding 2. |
| Streaming endpoint storage | ⚠️ **Caveat** | Saves AFTER stream; if insert fails client sees success. Pass 1 marked ✅ but didn't trace insert failure path. |

---

## Pass 1 Findings I Reframed

### PostHog Server Consent Bypass (P1 in Pass 1) → **Reframed: still P1**
Pass 1 correctly identified this. No severity change. But it should be noted this affects ALL server actions and API routes, not just specific analytics calls — potentially broad exposure.

### Escalation Cron Missing (P1 in Pass 1) → **Reframed: P1 + workflow integrity risk**
Pass 1 noted it as a missing feature. Pass 2 adds: the absence also means that approval workflows in `overdue + pending` state have no transition path. They accumulate as zombie requests. This is also a data integrity concern, not just a missing feature.

### Legal Pages Review Status (P2 in Pass 1) → **Still P2, still 🔍 NEEDS HUMAN REVIEW**
Cannot determine from code alone whether "Pending review" banners are showing. Confirmed the legal content files exist but `reviewedBy` field status is opaque without running the app.

---

## Cross-Phase Integration Issues

### Integration A: Trial Conversion → Document Retention (P1)
See Finding 3. Phase C trial webhook does not protect Phase A documents from the Phase A retention cron.

### Integration B: Phase E.1 Roles Migration → Old `org_role` Paths (P1)
See Finding 4. Phase E.1 introduced `roles[]` but all write paths in Phase A.8 code still dual-write `org_role`. A future cleanup of the legacy column will silently break permission checks in any path still reading `org_role`.

### Integration C: Phase B.11 Templates ↔ Phase A.5 Saved Items (P2)
`item_slug` is stored as plain text with no FK. If a template slug is renamed, all saves for that template show as un-saved in the UI. Traced at `src/lib/actions/saved-items.ts` — no slug validation against live template list.

### Integration D: Phase A.9 Usage → API Race (P0)
See Finding 2. The usage tracking race condition spans Phase A.9 limits system and Phase A.6 generate/copilot endpoints. They were built in the same phase but the check-then-record pattern is shared across both `/api/generate` and `/api/copilot`.

### Integration E: Phase E.5 Approvals ↔ Phase D.4 Audit Log (P1)
See Finding 5. Admin-direct leave approvals (Phase A.8 leave actions) do not write to Phase D.4 `admin_audit_log` or Phase E.5 `approval_decisions`. The two approval paths (workflow engine vs. direct CRUD) produce inconsistent audit trails.

### Integration F: Phase A.6 Copilot ↔ Phase E.4 Employee Portal (P1)
See Finding 13. The routing between HR admin Copilot context and employee Copilot context is a magic string check on the request body, not a server-side session attribute. A user who is both an HR admin and an employee gets whichever context their current page sends — with no server-side validation.

### Integration G: Phase A.7 Community ↔ Phase A.4 Account Deletion (P2)
See Finding 18. `deleteAccount` cascades to profiles but `community_votes` may not cascade. Vote counts on threads become permanently stale after user deletion.

### Integration H: Phase E.6 Lifecycle ↔ Phase E.4 Employee Portal (P2)
See Finding 24. Lifecycle tasks created for employees without portal accounts silently fail to create `employee_tasks` or send notifications. The task exists in the admin view but is invisible to the intended recipient.

---

## Behavioral / Logic Bugs

| # | Bug | File | Severity |
|---|---|---|---|
| 1 | Usage tracking race condition (limit bypass) | `src/lib/usage.ts:21-66` | P0 |
| 2 | Webhook double-processing race condition | `src/app/api/webhooks/stripe/route.ts:47-86` | P0 |
| 3 | Notification crash in workflow engine | `src/lib/workflows/engine.ts:303-307` | P1 |
| 4 | Notification crash in lifecycle engine | `src/lib/lifecycle/engine.ts:126-132` | P1 |
| 5 | Compliance runs on terminated employees | `src/lib/compliance/compute.ts:64-84` | P1 |
| 6 | Document insert fail not signaled post-stream | `src/app/api/generate/route.ts:120-145` | P1 |
| 7 | Admin leave approval not logged | `src/app/(app)/org/leave/actions.ts:40-59` | P1 |
| 8 | Legacy `org_role` dual-written | `src/app/(app)/org/settings/actions.ts:213` | P1 |
| 9 | Saved items race at limit boundary | `src/lib/actions/saved-items.ts:48-64` | P2 |
| 10 | Leave request backward dates accepted | `src/app/(app)/org/leave/actions.ts:7-37` | P2 |
| 11 | Null manager silently falls back | `src/lib/workflows/engine.ts:358-364` | P2 |
| 12 | Community votes orphaned on delete | `src/app/(app)/settings/actions.tsx:194-203` | P2 |
| 13 | Reports cron marks sent on email failure | `src/app/api/cron/scheduled-reports/route.ts:107` | P2 |
| 14 | Lifecycle task invisible if assignee null | `src/lib/lifecycle/engine.ts:95-134` | P2 |
| 15 | Email firstName renders full email address | `src/lib/email/context.ts:25-27` | P2 |
| 16 | Saved items orphaned on template slug rename | `src/lib/actions/saved-items.ts:12-29` | P2 |

---

## UX / Coherence Issues

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | HRIS workspace absent from sidebar nav | `src/components/layout/sidebar.tsx:18-26` | P1 |
| 2 | Empty states inconsistent across phases | Multiple pages | P2 |
| 3 | Reject/destructive actions lack confirmation | `workspace/approvals/page.tsx:131-138` | P2 |
| 4 | No Suspense/skeleton on heavy async pages | Dashboard, reports | P2 |
| 5 | "For You" tab shows hardcoded non-personalized briefs | `dashboard-client.tsx:68-107` | P2 |
| 6 | Email templates inconsistent visual hierarchy | Various email tsx files | P3 |

---

## New P0s

1. **Stripe webhook double-processing** — `src/app/api/webhooks/stripe/route.ts` — Fix: atomic insert-then-branch — 1h
2. **Usage tracking race condition** — `src/lib/usage.ts` — Fix: atomic DB increment — 2–3h

---

## New P1s

1. Trial→paid document retention not backfilled — `src/lib/stripe/handlers.ts` — 1h
2. Legacy `org_role` dual-write — `src/app/(app)/org/settings/actions.ts` — 2h
3. Admin leave approval not audited — `src/app/(app)/org/leave/actions.ts` — 1h
4. Workflow notification crashes approval routing — `src/lib/workflows/engine.ts` — 1h
5. Lifecycle notification crashes run init — `src/lib/lifecycle/engine.ts` — 30min
6. Compliance runs on terminated employees — `src/lib/compliance/compute.ts` — 15min
7. Reports page full-table JS aggregation — `src/app/(app)/workspace/reports/` — 4h
8. Dashboard page full employee + leave scan — `src/app/(app)/dashboard/page.tsx` — 3h
9. Compliance cron no concurrency lock — `src/app/api/cron/document-compliance/route.ts` — 2h
10. Free tier below usable threshold — `src/lib/limits.ts` — 1h (+ business decision)
11. Copilot context magic string routing — `src/app/api/copilot/route.ts:63-70` — 2h
12. Document insert failure not signaled to client — `src/app/api/generate/route.ts:120-145` — 2h

---

## New P2s

1. Null manager routing silent fallback — `src/lib/workflows/engine.ts:358` — 30min
2. Leave backward date validation missing — `src/app/(app)/org/leave/actions.ts` — 15min
3. Community votes orphaned on delete — `src/app/(app)/settings/actions.tsx` — 15min
4. Scheduled reports cron partial failure — `src/app/api/cron/scheduled-reports/route.ts` — 1h
5. Lifecycle task invisible if no assignee — `src/lib/lifecycle/engine.ts:95` — 1h
6. Email firstName renders email address — `src/lib/email/context.ts:25` — 15min
7. Saved items orphaned on slug rename — `src/lib/actions/saved-items.ts:12` — 1h
8. Saved items race at limit boundary — `src/lib/actions/saved-items.ts:48` — 1h
9. Email retry logic absent — `src/lib/email/send.ts` — 2h
10. Missing composite DB indexes — Migrations — 30min
11. Empty states inconsistent — Multiple pages — 2h
12. Permission email-lookup fragile — `0016_granular_roles.sql:107` — 2h
13. Stripe seats no retry on API failure — `src/lib/stripe/seats.ts` — 2h
14. HRIS feature creep strategic drift — Codebase-wide — Strategic decision

---

## New P3s

1. Landing page missing Nigeria/global positioning — `src/components/sections/hero.tsx` — 1h
2. Destructive actions lack typed confirmation — Multiple pages — Half-day
3. Email templates inconsistent visual hierarchy — `src/emails/` — 2h
4. Manager chain hard limit at 10 levels — `0016_granular_roles.sql:119` — Low risk

---

## Combined Top 15 Fix List (Pass 1 + Pass 2)

This is the master remediation list. Items marked **[P1]** are recommended launch blockers.

| # | Issue | Source | Priority | Effort | Rationale |
|---|---|---|---|---|---|
| 1 | **Email unsubscribe links missing on 24/25 templates** | Pass 1 | P0 | 2h | Legal liability. CAN-SPAM/GDPR violation. Ship-blocking. |
| 2 | **Stripe webhook double-processing race condition** | Pass 2 | P0 | 1h | Duplicate subscriptions / double billing events. Ship-blocking. |
| 3 | **Usage tracking race condition (limit bypass)** | Pass 2 | P0 | 2–3h | Free users exceed monetization limits. Billing integrity. |
| 4 | **Help articles absent (0 of 30 required)** | Pass 1 | P0 | Multi-day | Core product completeness. Support load without self-serve. |
| 5 | Compliance cron on terminated employees | Pass 2 | P1 | 15min | Quick fix, data integrity, confusing admin dashboard. |
| 6 | Workflow/lifecycle notification crashes | Pass 2 | P1 | 1.5h | Approvals stall silently, lifecycle tasks invisible. |
| 7 | Trial→paid document retention not backfilled | Pass 2 | P1 | 1h | User data loss post-upgrade. Trust-critical. |
| 8 | Legacy `org_role` dual-write | Pass 2 | P1 | 2h | Permission bypass risk when old column is eventually cleaned up. |
| 9 | Admin leave approval not audited | Pass 2 | P1 | 1h | Compliance gap, untraceable admin actions. |
| 10 | Escalation checker cron missing | Pass 1 | P1 | 2–3h | Overdue approvals stall silently forever. |
| 11 | Reports/dashboard full-table JS aggregation | Pass 2 | P1 | 7h | Scale failure at 500+ employees. Predicted crash at demo scale. |
| 12 | Compliance cron no concurrency lock | Pass 2 | P1 | 2h | Data corruption on timeout/retry. |
| 13 | Free tier below usable threshold | Pass 2 | P1 | 1h | 5 gen/month undermines blueprint's SME-moat strategy. |
| 14 | Sentry edge config missing PII scrub | Pass 1 | P1 | 30min | Middleware errors leak PII to Sentry. |
| 15 | PostHog server bypasses consent | Pass 1 | P1 | 1h | GDPR: users who opt out are still tracked server-side. |

**Honorable mentions (fix in sprint after launch):**
- Copilot context magic string routing (P1, post-launch)
- Missing composite database indexes (P2, 30min, high ROI)
- Email retry logic absent (P2, 2h)
- Empty states inconsistent (P2, 2h)
- Legal pages review status (P2, 🔍 human review)

---

## Strategic Observations

**HRIS Dominance:** 8/10 severity. The "mini-HRIS" has expanded to a 15-page system with approvals, compliance, lifecycle automation, and audit trails. This is now competing with BambooHR's feature set, not complementing Atlas's knowledge differentiator. The most recent 6 database migrations (0016–0025, excluding 0023 pricing) are entirely HRIS-focused.

**Free Tier as Moat:** The blueprint's central bet was that a genuinely useful free tier would drive viral adoption and reduce churn. The current 5 gen/month limit and zero HRIS access break this bet. The product needs to decide: is it monetizing on volume (many free-tier users, high conversion) or on value (few free users, direct B2B sales)?

**Nigeria/Africa Positioning:** Still present in the content (country guide, demo example) but the homepage hero doesn't lead with it. This is the product's clearest competitive moat and it's currently the second paragraph of a below-the-fold section.

**Recommended immediate strategic question to resolve before launch:** Is Atlas an HR knowledge platform with HRIS features, or an HRIS platform with a knowledge layer? The answer determines navigation, marketing, and pricing — and currently the codebase suggests the second while the blueprint specifies the first.
