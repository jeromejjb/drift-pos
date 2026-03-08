import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Send, UtensilsCrossed, ArrowDownToLine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { PageShell } from '../components/layout/PageShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AuthGate } from '../components/auth/AuthGate';

/**
 * Money — placeholder for future budgeting & tracking.
 * Open experience: no sign-in required to view; gate only for activity.
 */
export function MoneyPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !accessToken || !API_URL) return;
    fetch(`${API_URL}/api/p2p/balance`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d != null && setBalanceCents(d.balanceCents ?? 0))
      .catch(() => {});
  }, [user, accessToken]);

  const balance = balanceCents !== null ? (balanceCents / 100).toFixed(2) : null;

  return (
    <PageShell>
      <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
        <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
        <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-1 tracking-tight">Money</h1>
        <p className="text-sm text-[var(--drift-ink-muted)] mt-1.5 max-w-sm">
          Your money in one place. Track spending and budgets — coming soon.
        </p>
      </header>

      <div className="px-5 py-6 max-w-md mx-auto">
        {user && balance !== null && (
          <Card padding="lg" className="mb-6 bg-[var(--drift-surface)] border-[var(--drift-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--drift-ink-subtle)]">Balance</p>
                <p className="text-2xl font-bold text-[var(--drift-ink)]">${balance}</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/withdraw')} icon={<ArrowDownToLine className="w-4 h-4" />}>
                Withdraw
              </Button>
            </div>
          </Card>
        )}
        <Card padding="lg" className="mb-6 bg-[var(--drift-accent-muted)]/50 border-[var(--drift-accent)]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[var(--drift-radius)] bg-[var(--drift-accent)]/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-[var(--drift-accent)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--drift-ink)]">Budgeting & insights</h3>
              <p className="text-sm text-[var(--drift-ink-muted)] mt-1">
                See where your money goes. Categories, trends, and goals — all in Drift.
              </p>
            </div>
          </div>
        </Card>

        <h2 className="text-sm font-medium text-[var(--drift-ink-muted)] uppercase tracking-wider mb-3">
          Quick actions
        </h2>
        <div className="space-y-2 mb-8">
          <button
            type="button"
            onClick={() => navigate('/pay')}
            className="w-full flex items-center gap-3 p-4 rounded-[var(--drift-radius-lg)] bg-[var(--drift-surface)] border border-[var(--drift-border)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-[var(--drift-radius)] bg-[var(--drift-surface-overlay)] flex items-center justify-center">
              <Send className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--drift-ink)]">Send money</p>
              <p className="text-sm text-[var(--drift-ink-muted)]">Pay friends or split bills</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 p-4 rounded-[var(--drift-radius-lg)] bg-[var(--drift-surface)] border border-[var(--drift-border)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-[var(--drift-radius)] bg-[var(--drift-surface-overlay)] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--drift-ink)]">Check out with Drift</p>
              <p className="text-sm text-[var(--drift-ink-muted)]">Scan & pay at the table</p>
            </div>
          </button>
        </div>

        <section>
          <h2 className="text-sm font-medium text-[var(--drift-ink-muted)] uppercase tracking-wider mb-3">
            Recent activity
          </h2>
          {user ? (
            <p className="text-sm text-[var(--drift-ink-subtle)] py-6 text-center rounded-[var(--drift-radius-lg)] bg-[var(--drift-surface)] border border-[var(--drift-border)]">
              P2P sends and dining payments will show up here.
            </p>
          ) : (
            <div className="py-6 px-4 rounded-[var(--drift-radius-lg)] bg-[var(--drift-surface)] border border-[var(--drift-border)] text-center">
              <p className="text-sm text-[var(--drift-ink-muted)] mb-4">Sign in to see your activity</p>
              <Button onClick={() => setShowAuthGate(true)}>Sign in or create account</Button>
            </div>
          )}
        </section>
      </div>

      {showAuthGate && (
        <AuthGate
          reason="to see your activity"
          defaultSignUp
          onSuccess={() => setShowAuthGate(false)}
          onDismiss={() => setShowAuthGate(false)}
        />
      )}
    </PageShell>
  );
}
