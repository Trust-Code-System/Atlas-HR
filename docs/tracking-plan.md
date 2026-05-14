# Atlas HR — Event Tracking Plan

Single source of truth for all analytics events. Every event in PostHog must appear here first.
Governed by: `src/lib/analytics/track.ts` (client) and `src/lib/analytics/track-server.ts` (server).

---

## Naming conventions

- Event names: `snake_case`, past tense verb. e.g. `tool_generated`, `article_viewed`
- Property names: `snake_case` nouns. e.g. `tool_slug`, `plan`
- **Never** use PII as property values — no email, no full name, no IP address

---

## Acquisition

| Event | Trigger | Properties |
|---|---|---|
| `signup_started` | User loads step 1 of the sign-up wizard | `source: 'pricing' \| 'landing' \| 'invite' \| 'direct'` |
| `signup_completed` | User finishes onboarding (step 3 submitted) | `source, country, industry, company_size, goals_count` |
| `oauth_initiated` | User clicks Google/LinkedIn OAuth button | `provider: 'google' \| 'linkedin'` |
| `email_verified` | User clicks verification link | — |
| `onboarding_step_completed` | User advances from a wizard step | `step: 1 \| 2 \| 3, time_on_step_seconds` |
| `onboarding_completed` | Full onboarding marked complete | `total_time_seconds` |
| `onboarding_abandoned` | User leaves mid-wizard | `last_step, time_to_abandon_seconds` |

---

## Activation (first useful action)

| Event | Trigger | Properties |
|---|---|---|
| `first_tool_generated` | First ever document generated | `tool_slug` |
| `first_template_downloaded` | First template download | `template_slug` |
| `first_copilot_message_sent` | First copilot message | — |
| `first_article_read` | First article viewed | `category, slug` |
| `first_community_post` | First thread or reply created | `category` |
| `first_save` | First item saved | `item_type` |

---

## Tools & document generation

| Event | Trigger | Properties |
|---|---|---|
| `tool_viewed` | Tool page loaded | `tool_slug, category` |
| `tool_generation_started` | Generate button clicked | `tool_slug, inputs_filled_count` |
| `tool_generation_completed` | Stream finished successfully | `tool_slug, time_seconds, output_chars` |
| `tool_generation_failed` | Stream threw or returned error | `tool_slug, error_type` |
| `tool_output_copied` | Copy button clicked | `tool_slug` |
| `tool_output_downloaded` | Download DOCX clicked | `tool_slug, format: 'docx'` |
| `tool_output_regenerated` | Regenerate clicked on a saved doc | `tool_slug` |

---

## Knowledge Hub

| Event | Trigger | Properties |
|---|---|---|
| `article_viewed` | Article page loaded | `category, slug, source: 'direct' \| 'search' \| 'related'` |
| `article_saved` | Article saved to library | `category, slug` |
| `article_helpful_voted` | Helpful? voted | `category, slug, helpful: boolean` |
| `glossary_term_clicked` | Glossary term tooltip opened | `term` |
| `country_guide_viewed` | Country guide page loaded | `country` |
| `industry_guide_viewed` | Industry guide page loaded | `industry` |

---

## Templates

| Event | Trigger | Properties |
|---|---|---|
| `template_viewed` | Template detail page loaded | `template_slug, category` |
| `template_downloaded` | Download clicked | `template_slug, format` |
| `template_premium_lock_clicked` | Premium lock CTA clicked | `template_slug` |

---

## Copilot

| Event | Trigger | Properties |
|---|---|---|
| `copilot_opened` | Panel opened | `source: 'panel_button' \| 'ask_about_button' \| 'standalone'` |
| `copilot_message_sent` | User sends a message | `message_chars, conversation_id` |
| `copilot_message_received` | Assistant reply finishes streaming | `conversation_id, response_chars, total_time_ms` |
| `copilot_conversation_deleted` | Conversation deleted | — |
| `copilot_conversation_exported` | Conversation exported | — |

---

## Community

| Event | Trigger | Properties |
|---|---|---|
| `community_thread_viewed` | Thread page loaded | `thread_id, category` |
| `community_thread_created` | New thread submitted | `category, is_anonymous, body_chars` |
| `community_reply_created` | Reply submitted | `thread_id, is_anonymous` |
| `community_voted` | Vote cast on thread or reply | `target_type: 'thread' \| 'reply', value: 1 \| -1` |
| `community_answer_accepted` | OP accepts an answer | `thread_id` |

---

## Learning

| Event | Trigger | Properties |
|---|---|---|
| `course_viewed` | Course page loaded | `course_slug` |
| `course_enrolled` | Enroll clicked | `course_slug, is_premium` |
| `lesson_started` | Lesson started | `lesson_slug, course_slug` |
| `lesson_completed` | Lesson marked complete | `lesson_slug, course_slug, time_seconds` |
| `course_completed` | All lessons done | `course_slug, total_time_seconds` |
| `certificate_earned` | Certificate issued | `course_slug` |

---

## Mini-HRIS

| Event | Trigger | Properties |
|---|---|---|
| `org_created` | Organisation created | `industry, country, size` |
| `employee_added` | Employee record created | `method: 'manual' \| 'csv_import'` |
| `leave_request_created` | Leave request submitted | `type` |
| `leave_request_approved` | Leave request approved | — |
| `leave_request_rejected` | Leave request rejected | — |
| `org_member_invited` | Invite sent | — |
| `org_member_joined` | Invite accepted | — |

---

## Monetisation

| Event | Trigger | Properties |
|---|---|---|
| `pricing_viewed` | Pricing page loaded | `source` |
| `checkout_started` | Checkout session created | `plan, interval` |
| `checkout_completed` | Stripe checkout.session.completed | `plan, interval` |
| `subscription_started` | First active subscription | `plan, interval, in_trial: boolean` |
| `trial_converted` | Trial → paid conversion | `plan, interval` |
| `trial_expired` | Trial ended without converting | `plan` |
| `subscription_upgraded` | Plan change up | `from_plan, to_plan` |
| `subscription_downgraded` | Plan change down | `from_plan, to_plan` |
| `subscription_canceled` | Subscription deleted | `plan, days_active` |
| `subscription_reactivated` | Cancelled subscription re-activated | `plan` |
| `payment_failed` | Invoice payment failed | `plan, attempt_number` |
| `upgrade_dialog_shown` | Upgrade dialog opened | `trigger_feature` |
| `upgrade_dialog_clicked` | Upgrade CTA in dialog clicked | `trigger_feature, target_plan` |
| `usage_limit_hit` | User hits a resource limit | `resource, plan` |

---

## Engagement

| Event | Trigger | Properties |
|---|---|---|
| `search_performed` | Search query submitted | `query_chars, results_count` |
| `theme_changed` | Appearance theme preset changed | `from, to` |
| `accent_changed` | Accent colour changed | `from, to` |
| `appearance_mode_changed` | Light/dark mode toggled | `theme: string, accent: string` |

---

## PostHog funnels to configure

1. **Signup funnel**: `signup_started` → `signup_completed` → `first_tool_generated`
2. **Activation funnel**: `signup_completed` → any `first_*` event within 7 days
3. **Trial-to-paid funnel**: `signup_completed` → `subscription_started` → `trial_converted`
4. **Tool funnel**: `tool_viewed` → `tool_generation_started` → `tool_generation_completed` → `tool_output_downloaded`

---

## PostHog dashboards to build

1. **North Star** — DAU, MAU, stickiness (DAU/MAU), signups/day, activations/day
2. **Acquisition** — signup sources, onboarding drop-off per step
3. **Activation** — % hitting a `first_*` event within 7 days of signup
4. **Engagement** — tools used per active user per week, copilot messages per active user
5. **Monetisation** — trial-to-paid %, MRR growth, churn by cohort
6. **Feature Adoption** — % of users who have tried each tool, copilot, community
