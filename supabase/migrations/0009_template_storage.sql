insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'templates',
  'templates',
  true,
  20971520,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'application/json'
  ]
)
on conflict (id) do nothing;

create table if not exists public.template_assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  variant text not null default 'global' check (variant in ('global','us','uk','ng','in')),
  docx_path text not null,
  preview_image_path text not null,
  docx_url text,
  preview_image_url text,
  metadata jsonb not null default '{}',
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, variant)
);

create index if not exists idx_template_assets_slug
  on public.template_assets(slug, variant);

alter table public.template_assets enable row level security;

create policy "Anyone can read template assets"
  on public.template_assets
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage template assets"
  on public.template_assets
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create trigger trg_template_assets_updated before update on public.template_assets
  for each row execute function public.handle_updated_at();

create policy "Template files are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'templates');

create policy "Admins can insert template files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'templates'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "Admins can update template files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'templates'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    bucket_id = 'templates'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "Admins can delete template files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'templates'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
