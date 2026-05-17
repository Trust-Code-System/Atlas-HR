# Atlas HR Competitive Growth Audit

This audit checks the "top HR platform" growth ideas against the current Atlas HR codebase.

Status legend:

- **Live**: implemented as a working product or public page.
- **Partial**: visible or partially implemented, but not enough to market as complete.
- **Roadmap**: not built yet.
- **Upgrade**: exists, but needs depth, proof, integrations, or clearer positioning.

## Product Strategy Audit

| Strategy | Current status | Evidence in Atlas HR | What to fix or build next |
| --- | --- | --- | --- |
| Deel/Oyster-style global compliance and hiring calculators | **Partial** | Public global hiring calculator exists on homepage with Nigeria, India, UK, US cost/risk estimates. Country hubs also exist. | Add source-backed employer tax/benefit calculations, save estimates to workspace, email capture, country-specific documents generated from the estimate, and official citation links. |
| Rippling-style automation builder | **Roadmap** | Homepage now shows this as roadmap. Workflow runs exist, but there is no visual if-this-then-that builder. | Build `workflow_templates`, `workflow_triggers`, and `workflow_actions`; add UI for triggers like hire, terminate, leave approved, asset assigned; connect to notifications, documents, integrations, and audit log. |
| BambooHR-style resource center | **Live, upgrade needed** | `/knowledge`, `/templates`, `/tools`, `/countries`, `/industries`, `/glossary`, `/workflows` exist. | Create one public "Resource Center" landing page that unifies all resource surfaces, adds lead magnets, newsletter capture, and downloadable packs. |
| HiBob-style employee experience | **Partial** | Employee profiles, org chart, self-service-related data model, tasks, leave, documents. | Add shoutouts, profile interests/hobby tags, employee anniversaries, employee homepage, team feed, and culture widgets. |
| Lattice-style continuous performance | **Partial** | Performance cycles/reviews and surveys exist. | Add 1:1 agendas, OKRs, goals, feedback notes, manager check-ins, and survey/time signals inside performance conversations. |
| Gusto-style delightful payroll/onboarding UX | **Partial** | Payroll runs, onboarding workflows, checklist-style flows. | Add guided payroll progress, plain-English pay explanations, employee-facing payroll summaries, onboarding celebration states, and conversational prompts. |
| Workday-style skills graph/internal mobility | **Partial** | Learning and succession exist, but no unified skills graph. | Add employee skills, proficiency, desired skills, role requirements, skill gap analysis, internal job matching, and promotion readiness evidence. |
| Factorial-style document plus e-signature | **Partial** | Document generation, templates, employee documents, file storage patterns exist. | Add native e-signature integration or provider abstraction, signature status, signing reminders, signed document archive, and audit evidence. |
| Personio-style regional compliance alerts | **Partial** | `/compliance-updates`, country hubs, trust metadata, compliance CMS foundations. | Connect to real editorial/legal update workflow, subscriptions, review approval, affected employees/documents, and in-app remediation workflows. |
| Culture Amp-style employee voice and predictive analytics | **Partial** | Surveys, analytics, dashboard, performance reviews exist. | Add validated survey templates, engagement benchmarks, attrition risk signals, recommended actions, and manager follow-up tasks. |

## Growth Strategy Audit

| Strategy | Current status | What is done | What needs upgrade |
| --- | --- | --- | --- |
| Product-led AI compliance sandbox | **Partial** | Homepage has a sandbox-style preview and Copilot exists in app. | Build a real limited public question flow with guardrails, citations, rate limits, lead capture, and handoff into sign-up. |
| Cross-border corridor niche | **Live, upgrade needed** | Homepage and country hubs position Nigeria, India, UK, US corridors. | Add corridor landing pages such as `/corridors/uk-to-nigeria` and `/corridors/us-to-india`; include employer cost, contract, payroll, and compliance workflows. |
| Programmatic SEO | **Partial** | Public country, industry, workflow, template, tool, comparison pages exist. | Generate scalable pages from structured data: `{country} {workflow}`, `{country} {template}`, `{industry} HR software`, and `{country} compliance checklist`. |
| Interactive demo storytelling | **Partial** | `/demo` loads demo data inside the app. | Add public guided tours by buyer persona, with screenshots or embedded interactive walkthroughs. Keep `/demo` for authenticated workspace data. |
| Trust center as marketing tool | **Improved now** | Added `/trust` public page and navigation links. | Add subprocessor table, security whitepaper, AI data-use policy, SOC 2 readiness page, incident process, and procurement FAQ. |

## What Not To Overclaim Yet

Do not market these as complete until built:

- Full automation builder.
- Native e-signature.
- Continuous 1:1 and OKR platform.
- Predictive attrition analytics.
- Public AI compliance sandbox with citations.
- SOC 2 certification.
- Fully source-backed statutory cost calculators.

It is fine to market them as:

- "Roadmap"
- "Coming next"
- "Workflow foundations"
- "AI-assisted with human review"
- "Country-aware guidance, not legal advice"

## Highest Priority Build Order

1. **Trust Center depth**: subprocessor table, AI policy, procurement FAQ, security controls.
2. **Resource Center**: unify knowledge, templates, tools, countries, workflows, lead magnets.
3. **Public AI sandbox**: limited, cited, rate-limited HR Q&A that converts to signup.
4. **Global hiring estimate save flow**: turn calculator output into a saved checklist/workflow.
5. **Manager cockpit**: 1:1s, goals, performance notes, survey/time signals.
6. **Skills graph**: skills, gaps, learning, succession, internal mobility.
7. **E-signature**: generate document, send for signature, store signed copy, audit trail.
8. **Automation builder**: trigger/action workflow designer across HR, assets, documents, and integrations.

## Competitive Positioning

Use this positioning consistently:

> Atlas HR is a country-aware HR operating system for growing global teams. It combines HR records, workflows, documents, compliance intelligence, AI assistance, and people analytics in one workspace.

The strongest niche is:

> US and UK companies hiring or managing teams across Nigeria, India, the UK, and the US.

That niche is specific enough to rank, sell, and differentiate, while still broad enough to grow into a larger HR suite.
