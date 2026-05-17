create table public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  email text,
  invited_by uuid references public.profiles(id),
  cohort text default 'beta_1',
  is_vip boolean default false,
  expires_at timestamptz default (now() + interval '30 days'),
  access_expires_at timestamptz,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('bug','feature_request','content','general','onboarding','copilot','tools')),
  severity text default 'normal' check (severity in ('low','normal','high','blocker')),
  page_url text,
  body text not null,
  rating int check (rating between 1 and 5),
  screenshot_url text,
  status text default 'new' check (status in ('new','reviewing','planned','in_progress','done','wontfix')),
  admin_notes text,
  labels text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_beta_invites_code on public.beta_invites(code);
create index idx_beta_invites_used_by on public.beta_invites(used_by);
create index idx_beta_invites_cohort on public.beta_invites(cohort, created_at desc);
create index idx_beta_feedback_status on public.beta_feedback(status, created_at desc);
create index idx_beta_feedback_user on public.beta_feedback(user_id, created_at desc);
create index idx_beta_feedback_category on public.beta_feedback(category, created_at desc);

create trigger trg_beta_feedback_updated before update on public.beta_feedback
  for each row execute function public.handle_updated_at();

alter table public.beta_invites enable row level security;
alter table public.beta_feedback enable row level security;

create policy "Users can view own used beta invite" on public.beta_invites
  for select to authenticated
  using (auth.uid() = used_by);

create policy "Admins can manage beta invites" on public.beta_invites
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

create policy "Users can submit own beta feedback" on public.beta_feedback
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own beta feedback" on public.beta_feedback
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage beta feedback" on public.beta_feedback
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'beta-feedback',
  'beta-feedback',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "Beta users can upload own feedback attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'beta-feedback'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Beta users can view own feedback attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'beta-feedback'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "Admins can view beta feedback attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'beta-feedback'
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );
