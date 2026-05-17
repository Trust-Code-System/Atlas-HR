-- Atomic usage consumption using advisory locks.
-- Replaces the split checkUsage + recordUsage pattern which has a TOCTOU race:
-- two concurrent requests both read "used=4 < limit=5" before either writes,
-- allowing a free user to exceed their monthly cap.
--
-- pg_advisory_xact_lock serializes concurrent calls per (user_id, resource, period)
-- while allowing different users to run in parallel.

create or replace function public.consume_usage(
  _user_id  uuid,
  _resource text,
  _period   text,   -- 'day' | 'month'
  _limit    int
)
returns table (used int, allowed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  period_start_ts timestamptz;
  current_count   int;
  lock_key        bigint;
begin
  if _period = 'day' then
    period_start_ts := date_trunc('day', now() at time zone 'utc');
  elsif _period = 'month' then
    period_start_ts := date_trunc('month', now() at time zone 'utc');
  else
    raise exception 'Invalid period: %', _period;
  end if;

  -- Serialize concurrent requests for the same user + resource + period.
  -- hash combines the three values into a stable int8 key.
  lock_key := hashtext(_user_id::text || '|' || _resource || '|' || _period);
  perform pg_advisory_xact_lock(lock_key);

  -- Count current usage under the lock (no concurrent modification possible now)
  select coalesce(sum(count), 0)
    into current_count
    from public.usage_tracking
   where user_id     = _user_id
     and resource    = _resource
     and period_start >= period_start_ts;

  if current_count >= _limit then
    return query select current_count, false;
    return;
  end if;

  -- Increment atomically
  insert into public.usage_tracking (user_id, resource, count, period_start)
  values (_user_id, _resource, 1, period_start_ts);

  return query select current_count + 1, true;
end $$;

-- Advisory lock helpers for cron concurrency (used by compliance, escalation crons)
create or replace function public.try_advisory_lock(key bigint)
returns boolean
language sql
security definer
set search_path = public
as $$
  select pg_try_advisory_lock(key);
$$;

create or replace function public.release_advisory_lock(key bigint)
returns boolean
language sql
security definer
set search_path = public
as $$
  select pg_advisory_unlock(key);
$$;

-- Performance indexes (composite; single-column ones already exist)
create index if not exists idx_employees_org_status
  on public.employees(org_id, status);

create index if not exists idx_leave_requests_employee_status_created
  on public.leave_requests(employee_id, status, created_at desc);

create index if not exists idx_approval_requests_org_status
  on public.approval_requests(org_id, status);


create index if not exists idx_activity_log_org_created
  on public.activity_log(org_id, created_at desc);
