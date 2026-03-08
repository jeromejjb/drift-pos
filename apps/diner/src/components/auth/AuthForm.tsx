import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toAuthError } from '../../lib/userErrors';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineError } from '../ui/InlineError';

const AUTH_UNAVAILABLE = "Sign-in isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env (see apps/diner/.env.example).";

export interface AuthFormProps {
  onSuccess: () => void;
  /** Compact layout for inline use (e.g. inside AddCardModal) */
  compact?: boolean;
  /** Default to Create account tab (for Pay, Me — new users first) */
  defaultSignUp?: boolean;
}

/**
 * Shared auth form: Password (email + password).
 */
export function AuthForm({ onSuccess, compact = false, defaultSignUp = false }: AuthFormProps) {
  const { signIn, signUp, isAuthConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultSignUp ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetError = () => setError('');
  const space = compact ? 'space-y-4' : 'space-y-5';
  const mb = compact ? 'mb-3' : 'mb-6';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    const { error: err } =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim() || undefined);
    setLoading(false);
    if (err) {
      const raw = err.message || '';
      const isConfig = raw.includes('Auth not configured') || (raw.toLowerCase().includes('invalid') && raw.toLowerCase().includes('api key'));
      setError(isConfig ? AUTH_UNAVAILABLE : toAuthError(raw));
      return;
    }
    onSuccess();
  };

  if (!isAuthConfigured) {
    return (
      <div className={space}>
        <p className="text-sm text-[var(--drift-ink-muted)]">{AUTH_UNAVAILABLE}</p>
        <p className="text-xs text-[var(--drift-ink-subtle)] mt-2">
          Create a free project at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--drift-accent)]">supabase.com</a>, then copy Project URL and anon key to .env.
        </p>
      </div>
    );
  }

  return (
    <>
      {error ? <InlineError message={error} className={mb} /> : null}

      <div className={`flex rounded-[var(--drift-radius-pill)] bg-[var(--drift-surface-overlay)] p-1 ${mb}`}>
            <button
              type="button"
              onClick={() => { setMode('signin'); resetError(); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all ${
                mode === 'signin'
                  ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
                  : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); resetError(); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
                  : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
              }`}
            >
              Create account
            </button>
          </div>
      <form onSubmit={handleEmailSubmit} className={space}>
            {mode === 'signup' && (
              <Input
                label="Name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signin' ? '••••••••' : 'At least 8 characters'}
              required
              disabled={loading}
            />
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
      </form>
    </>
  );
}
