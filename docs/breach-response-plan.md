# Atlas HR Breach Response Plan

Draft internal plan. Pending counsel and security review.

## Detection

Inputs include monitoring alerts, user reports, Resend/Stripe/Supabase/Vercel notifications, suspicious logs, and staff reports.

## First 24 Hours

Assess what happened, what systems are affected, what data may be involved, how many users are affected, whether the incident is ongoing, and whether credentials or tokens need rotation.

## Containment

Isolate affected services, disable compromised accounts, rotate secrets, revoke sessions or API keys, pause vulnerable jobs, preserve logs, and document all actions.

## Legal and Regulatory Assessment

Within 24 hours, classify severity and notification obligations. Consider GDPR, UK GDPR, Nigerian data protection rules, US state breach laws, CCPA/CPRA, customer contracts, and Stripe or subprocessor notification duties.

## Notification

Where required, notify supervisory authorities within applicable deadlines, including 72 hours for GDPR-style obligations. Notify affected users when the incident creates high risk or law requires notice. Nigerian matters may require escalation to the NDPC.

## Communications

Use clear facts: what happened, what data was involved, what Atlas HR has done, what users should do, and how to contact support. Avoid speculation.

## Recovery

Patch root cause, validate fixes, monitor for recurrence, restore services, and verify no unauthorised access continues.

## Post-Incident Review

Document timeline, impact, decisions, evidence, customer notifications, regulator notifications, root cause, and preventive actions. Assign owners and deadlines for follow-up work.
