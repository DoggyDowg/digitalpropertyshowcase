create table if not exists public.instagram_post_cache (
  id uuid default gen_random_uuid() primary key,
  hashtag text not null unique,
  posts jsonb not null,
  cached_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table public.instagram_post_cache enable row level security;

-- Only allow the service role to access this table
create policy "Service role can manage instagram post cache"
  on public.instagram_post_cache
  for all
  to service_role
  using (true)
  with check (true); 