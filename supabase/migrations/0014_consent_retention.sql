alter table public.profiles
  add column if not exists cookie_consent jsonb;

create or replace function public.cleanup_retention_records()
returns void language plpgsql security definer as $$
begin
  delete from public.user_devices
  where last_seen_at < now() - interval '90 days';

  delete from public.emails_sent
  where created_at < now() - interval '365 days';

  delete from public.stripe_webhook_events
  where processed_at < now() - interval '90 days';

  delete from public.notifications
  where is_read = true
    and created_at < now() - interval '60 days';

  delete from public.usage_tracking
  where created_at < now() - interval '365 days';
end $$;

select cron.schedule(
  'cleanup-retention-records',
  '30 2 * * *',
  'select public.cleanup_retention_records()'
);
