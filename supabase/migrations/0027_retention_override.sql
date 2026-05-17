-- Add retention_override to generated_documents so that documents belonging to
-- users who have upgraded from free to paid are explicitly protected from the
-- nightly cleanup cron even if they later downgrade again.
--
-- The cleanup function now uses this column as a hard override: if set, the
-- document is never deleted regardless of the user's current role.

alter table public.generated_documents
  add column if not exists retention_override boolean not null default false;

-- Update the cleanup function to respect the override flag.
create or replace function public.cleanup_old_documents()
returns void language plpgsql security definer as $$
begin
  delete from public.generated_documents gd
  using public.profiles p
  where gd.user_id = p.id
    and p.role = 'free'
    and gd.retention_override = false
    and gd.created_at < now() - interval '30 days';
end $$;

-- Protect documents that already belong to users who have ever had a paid role.
-- This is a one-time backfill for existing data; new upgrades are handled in
-- the Stripe webhook handler (handleCheckoutCompleted / handleSubscriptionUpsert).
update public.generated_documents gd
set retention_override = true
from public.profiles p
where gd.user_id = p.id
  and p.role <> 'free';
