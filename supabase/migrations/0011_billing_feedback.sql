create table public.billing_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  org_id uuid references public.organisations(id) on delete set null,
  type text not null check (type in ('cancellation_considering')),
  message text not null,
  created_at timestamptz default now()
);

create index idx_billing_feedback_user
  on public.billing_feedback(user_id, created_at desc);

create index idx_billing_feedback_org
  on public.billing_feedback(org_id, created_at desc);

alter table public.billing_feedback enable row level security;

create policy "Users can submit billing feedback"
  on public.billing_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can view billing feedback"
  on public.billing_feedback
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
