-- Phase E.2: report scheduling and saved report views.
-- 0016 is used by the granular roles migration in this repo.

create table if not exists public.scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  report_slug text not null,
  filter_config jsonb default '{}'::jsonb,
  recipients text[] not null,
  cadence text not null check (cadence in ('weekly','monthly','quarterly')),
  day_of_week int check (day_of_week is null or day_of_week between 0 and 6),
  day_of_month int check (day_of_month is null or day_of_month between 1 and 28),
  format text default 'pdf' check (format in ('pdf','csv','xlsx')),
  next_send_at timestamptz not null,
  last_sent_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_scheduled_reports_next_send
  on public.scheduled_reports(next_send_at)
  where is_active = true;

create index if not exists idx_scheduled_reports_org
  on public.scheduled_reports(org_id, report_slug, created_at desc);

create table if not exists public.saved_report_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  report_slug text not null,
  name text not null,
  filter_config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_saved_report_views_org
  on public.saved_report_views(org_id, report_slug, created_at desc);

create trigger trg_saved_report_views_updated before update on public.saved_report_views
  for each row execute function public.handle_updated_at();

alter table public.scheduled_reports enable row level security;
alter table public.saved_report_views enable row level security;

create policy "View scheduled reports by permission"
  on public.scheduled_reports for select
  using (
    public.has_permission(org_id, 'view_reports')
    or public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_settings')
  );

create policy "Manage scheduled reports by permission"
  on public.scheduled_reports for all
  using (
    public.has_permission(org_id, 'manage_settings')
    or public.has_permission(org_id, 'all_hr')
  )
  with check (
    public.has_permission(org_id, 'manage_settings')
    or public.has_permission(org_id, 'all_hr')
  );

create policy "View saved report views by permission"
  on public.saved_report_views for select
  using (
    public.has_permission(org_id, 'view_reports')
    or public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_settings')
  );

create policy "Manage saved report views by permission"
  on public.saved_report_views for all
  using (
    public.has_permission(org_id, 'manage_settings')
    or public.has_permission(org_id, 'all_hr')
  )
  with check (
    public.has_permission(org_id, 'manage_settings')
    or public.has_permission(org_id, 'all_hr')
  );
