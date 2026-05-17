-- Add Stripe customer ID to profiles
alter table public.profiles add column stripe_customer_id text unique;

-- Add Stripe customer ID to organisations (for team plan billing)
alter table public.organisations add column stripe_customer_id text unique;

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Either user_id (Pro plan) or org_id (Team plan) is set, never both
  user_id uuid references public.profiles(id) on delete cascade,
  org_id uuid references public.organisations(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  stripe_seat_price_id text,
  plan text not null check (plan in ('pro','team','enterprise')),
  billing_interval text not null check (billing_interval in ('month','year')),
  status text not null check (status in ('trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused')),
  quantity int default 1,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint sub_owner_check check (
    (user_id is not null and org_id is null) or
    (user_id is null and org_id is not null)
  )
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_org on public.subscriptions(org_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_subscriptions_stripe on public.subscriptions(stripe_subscription_id);

-- Webhook event idempotency
create table public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now(),
  payload jsonb
);

-- Invoices (denormalized from Stripe for fast list display)
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  stripe_invoice_id text unique not null,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  org_id uuid references public.organisations(id) on delete set null,
  amount_paid int not null,
  amount_due int not null,
  currency text not null,
  status text not null,
  invoice_pdf text,
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now()
);

create index idx_invoices_user on public.invoices(user_id, created_at desc);
create index idx_invoices_org on public.invoices(org_id, created_at desc);

-- Update updated_at trigger
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Row level security
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy "Users see own subscriptions"
  on public.subscriptions for select using (
    auth.uid() = user_id or
    (org_id is not null and public.is_org_admin(org_id))
  );

create policy "Users see own invoices"
  on public.invoices for select using (
    auth.uid() = user_id or
    (org_id is not null and public.is_org_admin(org_id))
  );

-- Webhook events: service role only (no public policy = no access)
