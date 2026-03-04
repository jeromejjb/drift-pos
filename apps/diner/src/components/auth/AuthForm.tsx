import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toAuthError } from '../../lib/userErrors';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineError } from '../ui/InlineError';

const AUTH_UNAVAILABLE = "Sign-in isn't available right now. Please try again later.";

export interface AuthFormProps {
  onSuccess: () => void;
  /** Compact layout for inline use (e.g. inside AddCardModal) */
  compact?: boolean;
}

/**
 * Shared auth form: Email OTP + Password (sign-in/sign-up).
 * Uses Supabase built-in email — no external API keys.
 */
export function AuthForm({ onSuccess, compact = false }: AuthFormProps) {
  const { signIn, signUp, signInWithEmailOtp, verifyEmailOtp, isAuthConfigured } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email_otp' | 'email'>('email_otp');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signInWithEmailOtp(email.trim());
    setLoading(false);
    if (err) {
      const raw = err.message || '';
      const isConfig = raw.includes('Auth not configured') || (raw.toLowerCase().includes('invalid') && raw.toLowerCase().includes('api key'));
      setError(isConfig ? AUTH_UNAVAILABLE : toAuthError(raw));
      return;
    }
    setCodeSent(true);
    setOtp('');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await verifyEmailOtp(email.trim(), otp);
    setLoading(false);
    if (err) {
      setError(toAuthError(err.message || 'Invalid code'));
      return;
    }
    onSuccess();
  };

  if (!isAuthConfigured) {
    return (
      <div className={space}>
        <p className="text-sm text-[var(--drift-ink-muted)]">{AUTH_UNAVAILABLE}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex rounded-[var(--drift-radius-pill)] bg-[var(--drift-surface-overlay)] p-1 ${mb}`}>
        <button
          type="button"
          onClick={() => { setAuthMethod('email_otp'); resetError(); setCodeSent(false); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all flex items-center justify-center gap-1.5 ${
            authMethod === 'email_otp'
              ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
              : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email code
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('email'); resetError(); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all ${
            authMethod === 'email'
              ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
              : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
          }`}
        >
          Password
        </button>
      </div>

      {authMethod === 'email_otp' ? (
        codeSent ? (
          <form onSubmit={handleVerifyOtp} className={space}>
            <p className={`${compact ? 'text-sm' : 'text-[15px]'} text-[var(--drift-ink-muted)] leading-relaxed`}>
              We sent a 6-digit code to {email}. Enter it below.
            </p>
            <Input
              label="Code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
            />
            {error && <InlineError message={error} />}
            <Button type="submit" fullWidth disabled={loading || otp.length !== 6}>
              {loading ? '…' : 'Verify'}
            </Button>
            <button
              type="button"
              onClick={() => { setCodeSent(false); resetError(); }}
              className={`w-full ${compact ? 'text-sm py-2' : 'py-3 text-[15px]'} text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] transition-colors`}
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className={space}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
            {error && <InlineError message={error} />}
            <Button type="submit" fullWidth disabled={loading || !email.trim()}>
              {loading ? '…' : 'Send code'}
            </Button>
          </form>
        )
      ) : (
        <>
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
            {error && <InlineError message={error} />}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
