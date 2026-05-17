create table public.emails_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sending','sent','failed','bounced','complained')),
  resend_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index idx_emails_user on public.emails_sent(user_id, created_at desc);
create index idx_emails_status on public.emails_sent(status);

alter table public.emails_sent enable row level security;

create policy "Admins can view all emails" on public.emails_sent
  for select using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );
