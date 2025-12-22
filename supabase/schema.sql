
create extension if not exists pgcrypto;
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  content text,
  image_url text,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "Allow all" on public.messages for all using (true) with check (true);
select storage.create_bucket('chat-media', public := true);
