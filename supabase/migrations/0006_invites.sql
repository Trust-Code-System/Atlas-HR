-- ========== ORG INVITES ==========
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  org_role text default 'member' check (org_role in ('admin', 'member')),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique(org_id, email)
);

create index idx_org_invites_token on public.org_invites(token);
create index idx_org_invites_email on public.org_invites(email);
create index idx_org_invites_org on public.org_invites(org_id);

alter table public.org_invites enable row level security;

-- Org admins can manage invites for their org
create policy "Org admins can manage invites"
  on public.org_invites for all
  using (public.is_org_admin(org_id));

-- Anyone can read an invite by token (needed for acceptance page, handled via service role)
-- Unauthenticated lookup must go through service role in server actions
