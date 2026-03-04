// apps/landing/src/lib/supabase.ts (and same for restaurant)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Anon key: eyJ (JWT) or sb_publishable_. Never use sb_secret_ (service_role)
const isValidAnonKey = supabaseAnonKey && (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_'))
if (supabaseAnonKey && !isValidAnonKey) {
  console.warn('Supabase anon key should be eyJ... or sb_publishable_... (not sb_secret_)')
}

export const supabase = supabaseUrl && isValidAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null