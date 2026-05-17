create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id),
  action text not null,
  target_user_id uuid references public.profiles(id),
  target_resource text,
  target_resource_id text,
  before_value jsonb,
  after_value jsonb,
  reason text,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_admin
  on public.admin_audit_log(admin_user_id, created_at desc);
create index if not exists idx_audit_target
  on public.admin_audit_log(target_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_log'
      and policyname = 'Admins can view audit log'
  ) then
    create policy "Admins can view audit log" on public.admin_audit_log
      for select to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  name text,
  category text not null check (category in ('billing','technical','account','feature_request','other')),
  priority text default 'normal' check (priority in ('normal','urgent')),
  subject text not null,
  body text not null,
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id),
  is_from_admin boolean not null,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_tickets_status
  on public.support_tickets(status, created_at desc);
create index if not exists idx_tickets_user
  on public.support_tickets(user_id, created_at desc);
create index if not exists idx_ticket_messages_ticket
  on public.support_ticket_messages(ticket_id, created_at);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'handle_updated_at'
  ) and not exists (
    select 1 from pg_trigger where tgname = 'trg_support_tickets_updated'
  ) then
    create trigger trg_support_tickets_updated
      before update on public.support_tickets
      for each row execute function public.handle_updated_at();
  end if;
end $$;

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_tickets'
      and policyname = 'Users see own tickets'
  ) then
    create policy "Users see own tickets" on public.support_tickets
      for select to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_tickets'
      and policyname = 'Users create own tickets'
  ) then
    create policy "Users create own tickets" on public.support_tickets
      for insert to authenticated
      with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_tickets'
      and policyname = 'Admins manage tickets'
  ) then
    create policy "Admins manage tickets" on public.support_tickets
      for all to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_ticket_messages'
      and policyname = 'Users see own ticket messages'
  ) then
    create policy "Users see own ticket messages" on public.support_ticket_messages
      for select to authenticated
      using (
        exists (
          select 1
          from public.support_tickets t
          where t.id = ticket_id
            and t.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_ticket_messages'
      and policyname = 'Users post on own tickets'
  ) then
    create policy "Users post on own tickets" on public.support_ticket_messages
      for insert to authenticated
      with check (
        exists (
          select 1
          from public.support_tickets t
          where t.id = ticket_id
            and t.user_id = auth.uid()
        )
        and is_from_admin = false
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_ticket_messages'
      and policyname = 'Admins manage ticket messages'
  ) then
    create policy "Admins manage ticket messages" on public.support_ticket_messages
      for all to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end $$;
