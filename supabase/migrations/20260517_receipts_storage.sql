-- Receipt uploads bucket for the T&E module

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760, -- 10 MB
  array[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

-- Authenticated org members can upload receipts
create policy "receipts_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
  );

-- Authenticated org members can read receipts
create policy "receipts_select"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
  );

-- Owners can delete their own receipts
create policy "receipts_delete"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
  );
