-- Keep the legacy org_role flag aligned with granular workspace roles.
-- Older RLS policies and integrations still read org_role = 'admin',
-- while newer code grants access through roles such as workspace_owner/hr_admin.

update public.org_members
set org_role = 'admin'
where org_role <> 'admin'
  and roles && array['workspace_owner', 'hr_admin']::text[];

create or replace function public.is_org_admin(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = _org_id
      and om.user_id = auth.uid()
      and (
        om.org_role = 'admin'
        or om.roles && array['workspace_owner', 'hr_admin']::text[]
      )
  );
$$;
