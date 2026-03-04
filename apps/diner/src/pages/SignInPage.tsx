import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toAuthError } from '../lib/userErrors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InlineError } from '../components/ui/InlineError';

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/pay';
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(toAuthError(err.message));
      return;
    }
    navigate(returnTo.startsWith('/') ? returnTo : `/${returnTo}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] tracking-tight mt-1">Welcome back</h1>
          <p className="text-[var(--drift-ink-muted)] text-sm mt-2">Sign in to send money and pay at tables</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <InlineError message={error} />}
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            disabled={submitting || loading}
            className="mt-6"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-center text-sm text-[var(--drift-ink-muted)] mt-8">
          No account?{' '}
          <Link to={returnTo ? `/signup?return=${encodeURIComponent(returnTo)}` : '/signup'} className="text-[var(--drift-ink)] font-medium underline underline-offset-2 hover:no-underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
