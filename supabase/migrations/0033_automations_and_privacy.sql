-- Batch F: AI Workflow Builder (§22) + privacy hardening (§28)
--
-- Run this in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- §28a: per-document AI flag on personnel documents.
-- When false, the document is excluded from AI features (e.g. profile summaries).
-- ---------------------------------------------------------------------------
alter table public.employee_documents
  add column if not exists ai_enabled boolean not null default true;

-- ---------------------------------------------------------------------------
-- §22: user-defined trigger → action automations, generated from natural language.
-- A bounded catalogue of trigger/action types so a daily evaluator can run them
-- for real (see /api/cron/automations).
-- ---------------------------------------------------------------------------
create table if not exists public.automation_workflows (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  name          text not null,
  nl_prompt     text,                 -- the original natural-language rule
  trigger_type  text not null
                check (trigger_type in ('document_expiring','contract_ending','new_hire','leave_pending')),
  trigger_days  integer not null default 30,
  action_type   text not null
                check (action_type in ('notify_hr','notify_manager','create_task')),
  action_config jsonb not null default '{}'::jsonb,  -- e.g. {"task_title": "...", "message": "..."}
  is_active     boolean not null default true,
  last_run_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists automation_workflows_org_idx on public.automation_workflows (org_id);

alter table public.automation_workflows enable row level security;

drop policy if exists "org members can view automations" on public.automation_workflows;
create policy "org members can view automations"
  on public.automation_workflows for select
  using (public.is_org_member(org_id));

drop policy if exists "org admins manage automations" on public.automation_workflows;
create policy "org admins manage automations"
  on public.automation_workflows for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
