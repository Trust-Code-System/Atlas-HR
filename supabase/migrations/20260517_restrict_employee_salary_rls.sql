-- Replace the broad "org members can view employees" policy with one that
-- restricts non-admins to viewing only their own employee record.
-- Admins already have full access via the existing "Org admins can manage employees" policy.

drop policy if exists "Org members can view employees" on public.employees;

-- Employees can always see their own record (needed for portal pages)
create policy "Employees can view own record"
  on public.employees for select
  using (
    linked_user_id = auth.uid()
  );

-- Admins can view all employees in their org (covered by "manage" policy,
-- but adding explicit select for clarity and safety)
create policy "Org admins can view all employees"
  on public.employees for select
  using (public.is_org_admin(org_id));
