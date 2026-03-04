import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  /** Passwordless: send 6-digit code to email. Uses Supabase built-in email — no API key. */
  signInWithEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
    client.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) syncProfileToSupabase(client, s.user);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) syncProfileToSupabase(client, s.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  function toFriendlyAuthError(error: { message?: string } | Error | null): Error | null {
    if (!error) return null;
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('invalid') && msg.includes('api key')) return new Error('Auth not configured');
    if (msg.includes('fetch') || msg.includes('network')) return new Error('Connection error. Check your internet and try again.');
    return error instanceof Error ? error : new Error((error as { message?: string }).message || 'Sign in failed');
  }

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) syncProfileToSupabase(supabase, data.user);
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Sign in failed') };
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
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Sign up failed') };
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const normalized = normalizePhoneForE164(phone.trim());
      if (normalized.length < 10) return { error: new Error('Enter a valid phone number') };
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Failed to send code') };
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
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Invalid code') };
    }
  }, []);

  /** Passwordless email OTP — Supabase built-in, no external API. */
  const signInWithEmailOtp = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const e = email.trim().toLowerCase();
      if (!e || !e.includes('@')) return { error: new Error('Enter a valid email') };
      const { error } = await supabase.auth.signInWithOtp({ email: e });
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Failed to send code') };
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };
    try {
      const e = email.trim().toLowerCase();
      const otp = token.replace(/\D/g, '').slice(0, 6);
      if (otp.length !== 6) return { error: new Error('Enter the 6-digit code') };
      const { data, error } = await supabase.auth.verifyOtp({
        email: e,
        token: otp,
        type: 'email',
      });
      if (!error && data?.user) syncProfileToSupabase(supabase, data.user);
      return { error: toFriendlyAuthError(error) };
    } catch (e: any) {
      const err = e?.message ? { message: e.message } : e;
      return { error: toFriendlyAuthError(err) ?? new Error('Invalid code') };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const value: AuthState = {
    session,
    user,
    loading,
    isAuthConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signInWithPhone,
    verifyPhoneOtp,
    signInWithEmailOtp,
    verifyEmailOtp,
    signOut,
    accessToken: session?.access_token ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
