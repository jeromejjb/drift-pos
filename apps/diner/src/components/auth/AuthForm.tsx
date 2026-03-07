import { useState } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toAuthError } from '../../lib/userErrors';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { InlineError } from '../ui/InlineError';

const AUTH_UNAVAILABLE = "Sign-in isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env (see apps/diner/.env.example).";

/** Format phone for display: (555) 123-4567 */
function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return phone;
}

export interface AuthFormProps {
  onSuccess: () => void;
  /** Compact layout for inline use (e.g. inside AddCardModal) */
  compact?: boolean;
}

/**
 * Shared auth form: Email OTP + Phone OTP + Password (sign-in/sign-up).
 * Email uses Supabase built-in. Phone requires Send SMS hook (Twilio).
 */
export function AuthForm({ onSuccess, compact = false }: AuthFormProps) {
  const { signIn, signUp, signInWithEmailOtp, verifyEmailOtp, signInWithPhone, verifyPhoneOtp, isAuthConfigured } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email_otp' | 'phone_otp' | 'email'>('email_otp');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
    const { error: err } = authMethod === 'phone_otp'
      ? await verifyPhoneOtp(phone.trim(), otp)
      : await verifyEmailOtp(email.trim(), otp);
    setLoading(false);
    if (err) {
      setError(toAuthError(err.message || 'Invalid code'));
      return;
    }
    onSuccess();
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signInWithPhone(phone.trim());
    setLoading(false);
    if (err) {
      const raw = err.message || '';
      const isConfig = raw.includes('Auth not configured') || raw.includes('SMS provider');
      setError(isConfig ? 'Phone sign-in requires Twilio + Supabase Send SMS hook' : toAuthError(raw));
      return;
    }
    setCodeSent(true);
    setOtp('');
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

  const isOtp = authMethod === 'email_otp' || authMethod === 'phone_otp';

  return (
    <>
      <div className={`flex flex-wrap gap-1 rounded-[var(--drift-radius-pill)] bg-[var(--drift-surface-overlay)] p-1 ${mb}`}>
        <button
          type="button"
          onClick={() => { setAuthMethod('email_otp'); resetError(); setCodeSent(false); }}
          className={`flex-1 min-w-0 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all flex items-center justify-center gap-1.5 ${
            authMethod === 'email_otp'
              ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
              : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
          }`}
        >
          <Mail className="w-4 h-4 shrink-0" />
          Email
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('phone_otp'); resetError(); setCodeSent(false); }}
          className={`flex-1 min-w-0 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all flex items-center justify-center gap-1.5 ${
            authMethod === 'phone_otp'
              ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
              : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          Phone
        </button>
        <button
          type="button"
          onClick={() => { setAuthMethod('email'); resetError(); }}
          className={`flex-1 min-w-0 py-2.5 text-sm font-semibold rounded-[var(--drift-radius-pill)] transition-all ${
            authMethod === 'email'
              ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
              : 'text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]'
          }`}
        >
          Password
        </button>
      </div>

      {isOtp && codeSent ? (
        <form onSubmit={handleVerifyOtp} className={space}>
          <p className={`${compact ? 'text-sm' : 'text-[15px]'} text-[var(--drift-ink-muted)] leading-relaxed`}>
            We sent a 6-digit code to {authMethod === 'phone_otp' ? formatPhoneDisplay(phone) : email}. Enter it below.
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
              Use a different {authMethod === 'phone_otp' ? 'number' : 'email'}
            </button>
          </form>
        ) : isOtp ? (
          authMethod === 'phone_otp' ? (
            <form onSubmit={handleSendPhoneCode} className={space}>
              <Input
                label="Phone number"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="5551234567"
                disabled={loading}
              />
              {error && <InlineError message={error} />}
              <Button type="submit" fullWidth disabled={loading || phone.replace(/\D/g, '').length < 10}>
                {loading ? '…' : 'Send code'}
              </Button>
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
