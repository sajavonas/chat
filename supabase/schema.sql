
-- Enable extension for UUIDs
create extension if not exists pgcrypto;

-- Messages table with soft-delete and optional image
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  content text,
  image_url text,
  role text check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies: allow anon to read all, insert, and update (soft-delete)
create policy if not exists "Anon can read messages" on public.messages
  for select to anon using (true);

create policy if not exists "Anon can insert messages" on public.messages
  for insert to anon with check (true);

create policy if not exists "Anon can update messages" on public.messages
  for update to anon using (true) with check (true);

-- Storage bucket for images (public)
select storage.create_bucket('chat-media', public := true)
where not exists (
  select 1 from storage.buckets where id = 'chat-media'
);

-- Allow reading from the chat-media bucket
create policy if not exists "Anon can read chat-media" on storage.objects
  for select to anon using (bucket_id = 'chat-media');

-- Allow uploading into chat-media
create policy if not exists "Anon can upload chat-media" on storage.objects
  for insert to anon with check (bucket_id = 'chat-media');

-- Optional: allow update (e.g., overwriting) if needed
create policy if not exists "Anon can update chat-media" on storage.objects
  for update to anon using (bucket_id = 'chat-media') with check (bucket_id = 'chat-media');
