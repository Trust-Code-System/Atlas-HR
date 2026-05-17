-- Phase E.8: Business tier pricing and legacy Team grandfathering.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (
    role in (
      'free',
      'pro',
      'team_admin',
      'team_member',
      'business_admin',
      'business_member',
      'enterprise',
      'moderator',
      'admin'
    )
  );

alter table public.organisations
  drop constraint if exists organisations_plan_check;

alter table public.organisations
  add constraint organisations_plan_check check (plan in ('team','business','enterprise'));

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('pro','team','business','enterprise'));

alter table public.subscriptions
  add column if not exists legacy_pricing boolean not null default false,
  add column if not exists legacy_until date,
  add column if not exists legacy_price_summary text;

create index if not exists idx_subscriptions_legacy_pricing
  on public.subscriptions(legacy_pricing, legacy_until)
  where legacy_pricing = true;

comment on column public.subscriptions.legacy_pricing is
  'True for Team subscriptions grandfathered onto pre-E.8 pricing.';

comment on column public.subscriptions.legacy_until is
  'Date through which legacy Team pricing is honored before migration to current prices.';
