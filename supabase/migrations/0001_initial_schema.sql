-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========== PROFILES ==========
-- Extends auth.users with Atlas-specific fields.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  job_title text,
  country text,
  industry text,
  company_size text,
  bio text,
  goals text[] default '{}',
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  accent text default 'blue' check (accent in ('blue', 'purple')),
  role text default 'free' check (role in ('free','pro','team_admin','team_member','enterprise','moderator','admin')),
  is_verified boolean default false,
  reputation int default 0,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== ORGANISATIONS ==========
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text default 'team' check (plan in ('team','enterprise')),
  industry text,
  country text,
  size text,
  logo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_role text default 'member' check (org_role in ('admin','member')),
  invited_by uuid references public.profiles(id),
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

-- ========== EMPLOYEES (Mini-HRIS) ==========
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  full_name text not null,
  email text,
  job_title text,
  department text,
  manager_id uuid references public.employees(id),
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active','on_leave','terminated')),
  employment_type text check (employment_type in ('full_time','part_time','contract','intern')),
  country text,
  salary numeric,
  salary_currency text default 'USD',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  doc_type text not null,
  file_name text not null,
  file_url text not null,
  expires_at date,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  approver_id uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- ========== TOOL GENERATIONS & SAVED ITEMS ==========
create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool_slug text not null,
  tool_name text not null,
  inputs jsonb not null,
  output text not null,
  title text,
  created_at timestamptz default now()
);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('article','template','tool')),
  item_slug text not null,
  saved_at timestamptz default now(),
  unique(user_id, item_type, item_slug)
);

-- ========== COPILOT ==========
create table public.copilot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  context_type text,
  context_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.copilot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.copilot_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

-- ========== COMMUNITY ==========
create table public.community_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  region text,
  title text not null,
  body text not null,
  is_anonymous boolean default false,
  is_locked boolean default false,
  is_pinned boolean default false,
  vote_count int default 0,
  reply_count int default 0,
  view_count int default 0,
  last_reply_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  parent_reply_id uuid references public.community_replies(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_anonymous boolean default false,
  is_accepted_answer boolean default false,
  vote_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.community_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread','reply')),
  target_id uuid not null,
  value int not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);

-- ========== NOTIFICATIONS ==========
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ========== USAGE TRACKING (free-tier limits) ==========
create table public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource text not null,
  resource_ref text,
  count int default 1,
  period_start timestamptz not null,
  created_at timestamptz default now()
);

-- ========== INDEXES ==========
create index idx_profiles_email on public.profiles(email);
create index idx_org_members_user on public.org_members(user_id);
create index idx_org_members_org on public.org_members(org_id);
create index idx_employees_org on public.employees(org_id);
create index idx_employees_status on public.employees(status);
create index idx_leave_requests_employee on public.leave_requests(employee_id);
create index idx_generated_documents_user on public.generated_documents(user_id, created_at desc);
create index idx_saved_items_user on public.saved_items(user_id);
create index idx_copilot_conversations_user on public.copilot_conversations(user_id, updated_at desc);
create index idx_copilot_messages_conv on public.copilot_messages(conversation_id, created_at);
create index idx_threads_category on public.community_threads(category, created_at desc);
create index idx_threads_pinned on public.community_threads(is_pinned, created_at desc);
create index idx_replies_thread on public.community_replies(thread_id, created_at);
create index idx_votes_target on public.community_votes(target_type, target_id);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_usage_user_period on public.usage_tracking(user_id, resource, period_start);

-- ========== TRIGGERS ==========
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger trg_organisations_updated before update on public.organisations
  for each row execute function public.handle_updated_at();
create trigger trg_employees_updated before update on public.employees
  for each row execute function public.handle_updated_at();
create trigger trg_threads_updated before update on public.community_threads
  for each row execute function public.handle_updated_at();
create trigger trg_replies_updated before update on public.community_replies
  for each row execute function public.handle_updated_at();
create trigger trg_conversations_updated before update on public.copilot_conversations
  for each row execute function public.handle_updated_at();

-- Auto-create profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Maintain reply_count and last_reply_at on threads
create or replace function public.handle_reply_insert()
returns trigger language plpgsql as $$
begin
  update public.community_threads
    set reply_count = reply_count + 1, last_reply_at = now()
    where id = new.thread_id;
  return new;
end $$;

create trigger trg_reply_inserted after insert on public.community_replies
  for each row execute function public.handle_reply_insert();

create or replace function public.handle_reply_delete()
returns trigger language plpgsql as $$
begin
  update public.community_threads
    set reply_count = greatest(reply_count - 1, 0)
    where id = old.thread_id;
  return old;
end $$;

create trigger trg_reply_deleted after delete on public.community_replies
  for each row execute function public.handle_reply_delete();
