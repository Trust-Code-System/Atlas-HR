-- ============================================================
-- Travel & Expenses (T&E) Module
-- ============================================================

-- ─── Expenses ───────────────────────────────────────────────

create table if not exists expenses (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  employee_id    uuid not null references employees(id) on delete cascade,
  submitted_by   uuid references auth.users(id) on delete set null,

  category       text not null check (category in (
    'meal', 'transport', 'accommodation', 'supplies',
    'equipment', 'client_entertainment', 'conference', 'other'
  )),
  description    text not null,
  amount         numeric(12,2) not null check (amount > 0),
  currency       char(3) not null default 'USD',
  merchant       text,
  expense_date   date not null,
  receipt_url    text,

  status         text not null default 'pending' check (status in (
    'draft', 'pending', 'approved', 'rejected', 'reimbursed'
  )),
  notes          text,
  approved_by    uuid references auth.users(id) on delete set null,
  approved_at    timestamptz,
  reimbursed_at  timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_expenses_org_id      on expenses(org_id);
create index if not exists idx_expenses_employee_id on expenses(employee_id);
create index if not exists idx_expenses_status      on expenses(status);
create index if not exists idx_expenses_expense_date on expenses(expense_date desc);

-- ─── Travel Requests ────────────────────────────────────────

create table if not exists travel_requests (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organisations(id) on delete cascade,
  employee_id         uuid not null references employees(id) on delete cascade,
  submitted_by        uuid references auth.users(id) on delete set null,

  purpose             text not null,
  origin              text not null,
  destination         text not null,
  departure_date      date not null,
  return_date         date not null,
  estimated_budget    numeric(12,2),
  currency            char(3) not null default 'USD',

  status              text not null default 'pending' check (status in (
    'draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'
  )),
  notes               text,
  approved_by         uuid references auth.users(id) on delete set null,
  approved_at         timestamptz,

  -- Booking details (filled in by HR after approval)
  airline             text,
  flight_number       text,
  hotel_name          text,
  hotel_confirmation  text,
  check_in            date,
  check_out           date,
  per_diem_rate       numeric(10,2),
  actual_cost         numeric(12,2),
  booking_notes       text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_travel_requests_org_id      on travel_requests(org_id);
create index if not exists idx_travel_requests_employee_id on travel_requests(employee_id);
create index if not exists idx_travel_requests_status      on travel_requests(status);
create index if not exists idx_travel_requests_departure   on travel_requests(departure_date desc);

-- ─── Updated_at triggers ────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at_column();

create trigger trg_travel_requests_updated_at
  before update on travel_requests
  for each row execute function update_updated_at_column();

-- ─── RLS ────────────────────────────────────────────────────

alter table expenses        enable row level security;
alter table travel_requests enable row level security;

-- Org members can see all expenses in their org
create policy "expenses_select" on expenses
  for select using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

-- Employees can insert their own expenses; admins can insert for any employee
create policy "expenses_insert" on expenses
  for insert with check (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

-- Admins can update (approve/reject/reimburse); employee can update their own draft/pending
create policy "expenses_update" on expenses
  for update using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "expenses_delete" on expenses
  for delete using (
    org_id in (
      select org_id from org_members where user_id = auth.uid() and org_role = 'admin'
    )
  );

-- Travel requests
create policy "travel_select" on travel_requests
  for select using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "travel_insert" on travel_requests
  for insert with check (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "travel_update" on travel_requests
  for update using (
    org_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );

create policy "travel_delete" on travel_requests
  for delete using (
    org_id in (
      select org_id from org_members where user_id = auth.uid() and org_role = 'admin'
    )
  );
