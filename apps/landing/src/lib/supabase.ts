// apps/landing/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Try multiple ways to get env vars (Vite specific)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY

// Log what we found (for debugging)
console.log('🔍 Supabase URL found:', supabaseUrl ? '✅' : '❌')
console.log('🔍 Supabase Key found:', supabaseAnonKey ? '✅' : '❌')

let supabase: ReturnType<typeof createClient> | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '%c⚠️ Supabase environment variables are missing!\n' +
    'Please create a .env file in apps/landing with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key',
    'color: orange; font-weight: bold;'
  )
  // supabase remains null
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase };