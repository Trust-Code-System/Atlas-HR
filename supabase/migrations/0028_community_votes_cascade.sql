-- community_votes.target_id is polymorphic (thread OR reply) and cannot use a
-- regular FK constraint. These triggers cascade the delete so votes are cleaned
-- up whenever their parent thread or reply is removed.

create or replace function public.delete_votes_for_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.community_votes
  where target_type = 'thread' and target_id = old.id;
  return old;
end $$;

create or replace function public.delete_votes_for_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.community_votes
  where target_type = 'reply' and target_id = old.id;
  return old;
end $$;

create or replace trigger trg_cascade_thread_votes
  after delete on public.community_threads
  for each row execute function public.delete_votes_for_thread();

create or replace trigger trg_cascade_reply_votes
  after delete on public.community_replies
  for each row execute function public.delete_votes_for_reply();

-- One-time cleanup of already-orphaned votes
delete from public.community_votes v
where v.target_type = 'thread'
  and not exists (select 1 from public.community_threads t where t.id = v.target_id);

delete from public.community_votes v
where v.target_type = 'reply'
  and not exists (select 1 from public.community_replies r where r.id = v.target_id);
