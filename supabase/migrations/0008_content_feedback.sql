create table if not exists public.content_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  content_type text not null check (content_type in ('article','country_guide','industry_guide')),
  content_slug text not null,
  helpful boolean not null,
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_content_feedback_slug
  on public.content_feedback(content_type, content_slug, created_at desc);

alter table public.content_feedback enable row level security;

create policy "Anyone can submit content feedback"
  on public.content_feedback
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read content feedback"
  on public.content_feedback
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
