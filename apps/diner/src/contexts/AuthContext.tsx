import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toAuthErrorObject } from '../lib/userErrors';
import type { Session, User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Normalize phone to E.164: +1XXXXXXXXXX for 10-digit US, or +digits */
function normalizePhoneForE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && !phone.startsWith('+')) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

async function syncProfileToSupabase(client: SupabaseClient, user: User) {
  try {
    await client.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? undefined,
        name: (user.user_metadata?.name as string) ?? user.email?.split('@')[0] ?? undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (_) {
    // Table or RLS may not exist yet; ignore
  }
}

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** False when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing */
  isAuthConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  /** One-tap Google OAuth — fast, no password. Optional returnTo path after sign-in. */
  signInWithGoogle: (returnTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Refresh session; returns new access_token or null if refresh failed. Use when API returns 401 INVALID_TOKEN. */
  refreshSession: () => Promise<string | null>;
  /** Get token, refreshing if expired or about to expire (within 5 min). Use before API calls. */
  getValidToken: () => Promise<string | null>;
  accessToken: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    client.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s) {
        try {
          const { data: refreshed } = await client.auth.refreshSession();
          if (refreshed?.session) {
            setSession(refreshed.session);
            setUser(refreshed.session.user);
            syncProfileToSupabase(client, refreshed.session.user);
          } else {
            setSession(s);
            setUser(s.user);
            syncProfileToSupabase(client, s.user);
          }
        } catch {
          setSession(s);
          setUser(s.user);
          if (s.user) syncProfileToSupabase(client, s.user);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) syncProfileToSupabase(client, s.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) syncProfileToSupabase(supabase, data.user);
      return { error: toAuthErrorObject(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toAuthErrorObject(err) ?? new Error('Sign in failed') };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: name ? { data: { name } } : undefined,
      });
      if (!error && data?.user) syncProfileToSupabase(supabase, data.user);
      return { error: toAuthErrorObject(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toAuthErrorObject(err) ?? new Error('Sign up failed') };
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const normalized = normalizePhoneForE164(phone.trim());
      if (normalized.length < 10) return { error: new Error('Enter a valid phone number') };
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      return { error: toAuthErrorObject(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toAuthErrorObject(err) ?? new Error('Failed to send code') };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const normalized = normalizePhoneForE164(phone.trim());
      const otp = token.replace(/\D/g, '').slice(0, 6);
      if (otp.length !== 6) return { error: new Error('Enter the 6-digit code') };
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalized,
        token: otp,
        type: 'sms',
      });
      if (!error && data?.user) syncProfileToSupabase(supabase, data.user);
      return { error: toAuthErrorObject(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toAuthErrorObject(err) ?? new Error('Invalid code') };
    }
  }, []);

  /** One-tap Google OAuth — redirects to Google, then back to /auth/callback. */
  const signInWithGoogle = useCallback(async (returnTo?: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const next = returnTo || window.location.pathname || '/';
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      return { error: toAuthErrorObject(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toAuthErrorObject(err) ?? new Error('Sign in failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data?.session) return null;
      setSession(data.session);
      setUser(data.session.user);
      return data.session.access_token;
    } catch {
      return null;
    }
  }, []);

  /** Get token, refreshing proactively if expired or expiring within 5 minutes. */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!supabase || !session) return session?.access_token ?? null;
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt - now < 300) {
        const fresh = await refreshSession();
        return fresh ?? session.access_token;
      }
    }
    return session.access_token;
  }, [session, refreshSession]);

  const value: AuthState = {
    session,
    user,
    loading,
    isAuthConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signInWithPhone,
    verifyPhoneOtp,
    signInWithGoogle,
    signOut,
    refreshSession,
    getValidToken,
    accessToken: session?.access_token ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
