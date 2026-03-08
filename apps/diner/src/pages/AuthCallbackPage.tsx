import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * OAuth callback: exchange code for session, then redirect.
 * Add this URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError('Auth not configured');
      return;
    }
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/';
    const nextPath = next.startsWith('/') ? next : '/';

    if (!code) {
      setError('No auth code received');
      return;
    }

    let cancelled = false;
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message || 'Sign in failed');
          return;
        }
        navigate(nextPath, { replace: true });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Sign in failed');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--drift-surface-elevated)]">
        <p className="text-[var(--drift-ink-muted)] mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 rounded-[var(--drift-radius)] bg-[var(--drift-accent)] text-white font-medium"
        >
          Back to app
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--drift-surface-elevated)]">
      <p className="text-[var(--drift-ink-muted)]">Signing you in…</p>
    </div>
  );
}
