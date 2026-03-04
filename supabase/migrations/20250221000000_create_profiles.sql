-- Run this in Supabase Dashboard: SQL Editor
-- Creates profiles table and RLS so the diner app can sync user data to Supabase

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (e.g. on first sign-up)
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Optional: trigger to create profile on signup (keeps auth.users and profiles in sync)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
