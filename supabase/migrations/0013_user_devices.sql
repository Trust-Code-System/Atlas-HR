create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_hash text not null,
  user_agent text,
  city text,
  country text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  unique(user_id, device_hash)
);

create index idx_user_devices_user on public.user_devices(user_id);

alter table public.user_devices enable row level security;

create policy "Users see own devices" on public.user_devices
  for select using (auth.uid() = user_id);
