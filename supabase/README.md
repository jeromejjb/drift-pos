# Supabase (Diner auth + profiles)

## One-time setup

1. **Create `public.profiles` in your Supabase project**  
   In Supabase Dashboard → **SQL Editor**, run the migration:
   - [`migrations/20250221000000_create_profiles.sql`](migrations/20250221000000_create_profiles.sql)

2. **Env for the diner**  
   Ensure the repo root `.env` has:
   - `VITE_SUPABASE_URL` = your project URL  
   - `VITE_SUPABASE_ANON_KEY` = anon public key (Dashboard → Settings → API)

The diner loads these from the root `.env` (or from `.env.example` in dev if `.env` is missing). After sign-in or sign-up, the app upserts the current user into `public.profiles` so Supabase stays in sync.
