-- Enable pg_cron extension (available on Supabase Pro; on free tier, run this manually)
create extension if not exists pg_cron;

-- Function: delete generated documents older than 30 days for free users
create or replace function public.cleanup_old_documents()
returns void language plpgsql security definer as $$
begin
  delete from public.generated_documents gd
  using public.profiles p
  where gd.user_id = p.id
    and p.role = 'free'
    and gd.created_at < now() - interval '30 days';
end $$;

-- Schedule daily at 02:00 UTC
select cron.schedule(
  'cleanup-old-documents',
  '0 2 * * *',
  'select public.cleanup_old_documents()'
);
