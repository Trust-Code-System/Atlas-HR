-- Phase E.9: Sales enablement and Enterprise pilot groundwork.

alter table public.profiles
  add column if not exists sso_provider text;

create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text,
  company text,
  company_size text,
  role text,
  current_tools text[],
  biggest_challenge text,
  preferred_meeting_time text,
  source text not null check (source in ('demo_form','contact_sales','in_app_trigger','outbound')),
  status text default 'new' check (status in ('new','contacted','demo_scheduled','demo_completed','proposal_sent','negotiation','closed_won','closed_lost','nurture')),
  intent_score int default 50,
  assigned_to uuid references public.profiles(id),
  expected_arr int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sales_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads(id) on delete cascade,
  type text not null check (type in ('email_sent','email_opened','call_logged','meeting_held','demo_completed','proposal_sent','contract_signed','note_added','status_changed')),
  body text,
  metadata jsonb,
  performed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.implementation_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete cascade,
  sales_lead_id uuid references public.sales_leads(id) on delete set null,
  company text not null,
  sponsor_name text,
  sponsor_email text,
  tier text not null default 'enterprise_pilot' check (tier in ('business','enterprise_pilot','enterprise')),
  status text default 'planning' check (status in ('planning','implementation','active_use','evaluation','converted','cancelled')),
  pilot_starts_at date,
  pilot_ends_at date,
  assigned_to uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.implementation_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.implementation_projects(id) on delete cascade,
  title text not null,
  description text,
  phase text not null check (phase in ('implementation','active_use','evaluation')),
  assignee_type text default 'internal' check (assignee_type in ('internal','customer','shared')),
  due_at date,
  status text default 'pending' check (status in ('pending','in_progress','completed','blocked','skipped')),
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}'::text[],
  created_by uuid references public.profiles(id),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sales_leads_status on public.sales_leads(status, created_at desc);
create index if not exists idx_sales_leads_email on public.sales_leads(lower(email));
create index if not exists idx_sales_lead_activities_lead on public.sales_lead_activities(lead_id, created_at desc);
create index if not exists idx_implementation_projects_status on public.implementation_projects(status, created_at desc);
create index if not exists idx_implementation_tasks_project on public.implementation_tasks(project_id, status);
create index if not exists idx_api_keys_org on public.api_keys(org_id, revoked_at);

create trigger trg_sales_leads_updated before update on public.sales_leads
  for each row execute function public.handle_updated_at();

create trigger trg_implementation_projects_updated before update on public.implementation_projects
  for each row execute function public.handle_updated_at();

alter table public.sales_leads enable row level security;
alter table public.sales_lead_activities enable row level security;
alter table public.implementation_projects enable row level security;
alter table public.implementation_tasks enable row level security;
alter table public.api_keys enable row level security;

create policy "Public can create sales leads"
  on public.sales_leads for insert
  with check (source in ('demo_form','contact_sales','in_app_trigger'));

create policy "Sales team can manage leads"
  on public.sales_leads for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  );

create policy "Sales team can manage lead activities"
  on public.sales_lead_activities for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  );

create policy "Admins can manage implementation projects"
  on public.implementation_projects for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  );

create policy "Admins can manage implementation tasks"
  on public.implementation_tasks for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
  );

create policy "Workspace owners can view api keys"
  on public.api_keys for select using (public.has_permission(org_id, 'manage_org'));

create policy "Workspace owners can manage api keys"
  on public.api_keys for all using (public.has_permission(org_id, 'manage_org'))
  with check (public.has_permission(org_id, 'manage_org'));
