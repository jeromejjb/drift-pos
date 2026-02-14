// apps/landing/src/lib/supabase.ts (and same for restaurant)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate key format (anon keys start with 'eyJ')
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.error(
    '❌ Invalid Supabase anon key format. ' +
    'Make sure you are using the anon public key, not the service_role key.'
  )
}

console.log('🔧 Supabase config:', {
  url: supabaseUrl ? '✅' : '❌',
  key: supabaseAnonKey ? '✅' : '❌',
  keyPrefix: supabaseAnonKey?.substring(0, 10)
})

export const supabase = supabaseUrl && supabaseAnonKey?.startsWith('eyJ')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null