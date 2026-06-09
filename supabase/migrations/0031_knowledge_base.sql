-- Knowledge Base for RAG over the organisation's own uploaded documents.
-- Closes §1 (HR Brain grounded on uploaded handbook/policies) and §2 (Policy Q&A
-- grounded with no-guess / contact-HR behaviour). Retrieval ships on Postgres
-- full-text search now; an `embedding` column is included so semantic search can
-- be switched on later by populating it from a Voyage/OpenAI embeddings provider.
--
-- Run this in the Supabase SQL Editor.

-- pgvector — harmless to enable now; the embedding column stays null until a key is added.
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- kb_documents — one row per ingested source document
-- ---------------------------------------------------------------------------
create table if not exists kb_documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id) on delete cascade,
  title        text not null,
  source       text not null default 'upload'
               check (source in ('policy_library', 'upload', 'chat')),
  -- when source = 'policy_library', points at the policy_library row
  source_id    uuid,
  category     text not null default 'general',
  file_name    text,
  byte_size    bigint,
  status       text not null default 'pending'
               check (status in ('pending', 'ready', 'failed')),
  -- §28 privacy: when false, this document is excluded from AI answers
  ai_enabled   boolean not null default true,
  chunk_count  integer not null default 0,
  error        text,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists kb_documents_org_idx on kb_documents (org_id);
create index if not exists kb_documents_source_idx on kb_documents (source, source_id);

alter table kb_documents enable row level security;

drop policy if exists "org members can view kb documents" on kb_documents;
create policy "org members can view kb documents"
  on kb_documents for select
  using (is_org_member(org_id));

drop policy if exists "org admins can manage kb documents" on kb_documents;
create policy "org admins can manage kb documents"
  on kb_documents for all
  using (is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- kb_chunks — chunked, searchable text
-- ---------------------------------------------------------------------------
create table if not exists kb_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references kb_documents(id) on delete cascade,
  org_id         uuid not null references organisations(id) on delete cascade,
  chunk_index    integer not null,
  content        text not null,
  content_tsv    tsvector generated always as (to_tsvector('english', content)) stored,
  embedding      vector(1536),
  token_estimate integer,
  created_at     timestamptz not null default now()
);

create index if not exists kb_chunks_tsv_idx on kb_chunks using gin (content_tsv);
create index if not exists kb_chunks_org_idx on kb_chunks (org_id);
create index if not exists kb_chunks_document_idx on kb_chunks (document_id);
-- Vector index — usable once embeddings are populated; harmless while null.
create index if not exists kb_chunks_embedding_idx
  on kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table kb_chunks enable row level security;

drop policy if exists "org members can view kb chunks" on kb_chunks;
create policy "org members can view kb chunks"
  on kb_chunks for select
  using (is_org_member(org_id));

drop policy if exists "org admins can manage kb chunks" on kb_chunks;
create policy "org admins can manage kb chunks"
  on kb_chunks for all
  using (is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- match_kb_chunks — full-text ranked retrieval, scoped to an org, AI-enabled only
-- ---------------------------------------------------------------------------
create or replace function match_kb_chunks(
  p_org_id uuid,
  p_query text,
  p_match_count integer default 6
)
returns table (
  chunk_id    uuid,
  document_id uuid,
  doc_title   text,
  content     text,
  rank        real
)
language sql
stable
security invoker
as $$
  select
    c.id        as chunk_id,
    c.document_id,
    d.title     as doc_title,
    c.content,
    ts_rank(c.content_tsv, websearch_to_tsquery('english', p_query)) as rank
  from kb_chunks c
  join kb_documents d on d.id = c.document_id
  where c.org_id = p_org_id
    and d.ai_enabled = true
    and d.status = 'ready'
    and c.content_tsv @@ websearch_to_tsquery('english', p_query)
  order by rank desc
  limit greatest(p_match_count, 1);
$$;

-- ---------------------------------------------------------------------------
-- policy-docs storage bucket — original uploaded policy files (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'policy-docs',
  'policy-docs',
  false,
  20971520, -- 20 MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;

drop policy if exists "policy_docs_read" on storage.objects;
create policy "policy_docs_read"
  on storage.objects for select
  using (bucket_id = 'policy-docs' and auth.role() = 'authenticated');

drop policy if exists "policy_docs_write" on storage.objects;
create policy "policy_docs_write"
  on storage.objects for insert
  with check (bucket_id = 'policy-docs' and auth.role() = 'authenticated');

drop policy if exists "policy_docs_delete" on storage.objects;
create policy "policy_docs_delete"
  on storage.objects for delete
  using (bucket_id = 'policy-docs' and auth.role() = 'authenticated');
