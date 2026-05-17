-- Turn on RLS for everything
alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.org_members enable row level security;
alter table public.employees enable row level security;
alter table public.employee_documents enable row level security;
alter table public.leave_requests enable row level security;
alter table public.generated_documents enable row level security;
alter table public.saved_items enable row level security;
alter table public.copilot_conversations enable row level security;
alter table public.copilot_messages enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_votes enable row level security;
alter table public.notifications enable row level security;
alter table public.usage_tracking enable row level security;

-- Helper: is this user an admin of this org?
create or replace function public.is_org_admin(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = _org_id and user_id = auth.uid() and org_role = 'admin'
  );
$$;

-- Helper: is this user a member of this org?
create or replace function public.is_org_member(_org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = _org_id and user_id = auth.uid()
  );
$$;

-- ========== PROFILES ==========
create policy "Profiles are viewable by everyone authenticated"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ========== ORGANISATIONS ==========
create policy "Members can view their orgs"
  on public.organisations for select using (public.is_org_member(id));
create policy "Authenticated users can create orgs"
  on public.organisations for insert with check (auth.uid() = created_by);
create policy "Org admins can update org"
  on public.organisations for update using (public.is_org_admin(id));
create policy "Org admins can delete org"
  on public.organisations for delete using (public.is_org_admin(id));

-- ========== ORG_MEMBERS ==========
create policy "Members can view org_members of their orgs"
  on public.org_members for select using (public.is_org_member(org_id));
create policy "Org admins can manage members"
  on public.org_members for all using (public.is_org_admin(org_id));
create policy "Users can leave orgs (delete own membership)"
  on public.org_members for delete using (auth.uid() = user_id);

-- ========== EMPLOYEES ==========
create policy "Org members can view employees"
  on public.employees for select using (public.is_org_member(org_id));
create policy "Org admins can manage employees"
  on public.employees for all using (public.is_org_admin(org_id));

-- ========== EMPLOYEE_DOCUMENTS ==========
create policy "Org admins can manage employee documents"
  on public.employee_documents for all using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and public.is_org_admin(e.org_id)
    )
  );
create policy "Org members can view employee documents"
  on public.employee_documents for select using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and public.is_org_member(e.org_id)
    )
  );

-- ========== LEAVE_REQUESTS ==========
create policy "Org members can view leave requests in their orgs"
  on public.leave_requests for select using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and public.is_org_member(e.org_id)
    )
  );
create policy "Org admins can manage leave requests"
  on public.leave_requests for all using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id and public.is_org_admin(e.org_id)
    )
  );

-- ========== GENERATED DOCUMENTS ==========
create policy "Users see own documents" on public.generated_documents
  for select using (auth.uid() = user_id);
create policy "Users insert own documents" on public.generated_documents
  for insert with check (auth.uid() = user_id);
create policy "Users delete own documents" on public.generated_documents
  for delete using (auth.uid() = user_id);

-- ========== SAVED ITEMS ==========
create policy "Users manage own saved items" on public.saved_items
  for all using (auth.uid() = user_id);

-- ========== COPILOT ==========
create policy "Users manage own conversations" on public.copilot_conversations
  for all using (auth.uid() = user_id);
create policy "Users see messages in own conversations" on public.copilot_messages
  for select using (
    exists (
      select 1 from public.copilot_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy "Users insert messages in own conversations" on public.copilot_messages
  for insert with check (
    exists (
      select 1 from public.copilot_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ========== COMMUNITY ==========
create policy "Anyone authenticated can view threads" on public.community_threads
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users create threads" on public.community_threads
  for insert with check (auth.uid() = author_id);
create policy "Authors can update own threads" on public.community_threads
  for update using (auth.uid() = author_id);
create policy "Authors can delete own threads" on public.community_threads
  for delete using (auth.uid() = author_id);

create policy "Anyone authenticated can view replies" on public.community_replies
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users create replies" on public.community_replies
  for insert with check (auth.uid() = author_id);
create policy "Authors can update own replies" on public.community_replies
  for update using (auth.uid() = author_id);
create policy "Authors can delete own replies" on public.community_replies
  for delete using (auth.uid() = author_id);

create policy "Users manage own votes" on public.community_votes
  for all using (auth.uid() = user_id);

-- ========== NOTIFICATIONS ==========
create policy "Users see own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Users delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- ========== USAGE TRACKING ==========
create policy "Users see own usage" on public.usage_tracking
  for select using (auth.uid() = user_id);
-- inserts handled by service role
