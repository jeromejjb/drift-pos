// apps/restaurant/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log for debugging (remove in production)
console.log('🔧 Supabase config:', {
  url: supabaseUrl ? '✅' : '❌',
  key: supabaseAnonKey ? '✅' : '❌'
})

// Create client only if both are present
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper to check if Supabase is available
export const isSupabaseAvailable = !!supabase

// Mock functions for when Supabase isn't available (development)
export const mockSignOut = async () => {
  console.log('🔧 Mock sign out (Supabase not configured)')
  return { error: null }
}