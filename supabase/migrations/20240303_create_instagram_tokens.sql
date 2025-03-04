-- Drop existing policy if it exists
drop policy if exists "Service role can manage instagram tokens" on public.instagram_tokens;

create table if not exists public.instagram_tokens (
  id uuid default gen_random_uuid() primary key,
  access_token text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table public.instagram_tokens enable row level security;

-- Only allow the service role to access this table
create policy "Service role can manage instagram tokens"
  on public.instagram_tokens
  for all
  to service_role
  using (true)
  with check (true); 