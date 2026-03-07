import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Landmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui/Button';
import { AuthGate } from '../components/auth/AuthGate';

export function WithdrawPage() {
  const navigate = useNavigate();
  const { user, accessToken, loading: authLoading } = useAuth();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [hasPayoutAccount, setHasPayoutAccount] = useState<boolean | null>(null);
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!accessToken || !API_URL) return;
    Promise.all([
      fetch(`${API_URL}/api/p2p/balance`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`${API_URL}/api/p2p/has-payout-account`, { headers: { Authorization: `Bearer ${accessToken}` } }),
    ]).then(([r1, r2]) => {
      r1.ok && r1.json().then((d) => setBalanceCents(d.balanceCents ?? 0));
      r2.ok && r2.json().then((d) => setHasPayoutAccount(d.hasPayoutAccount ?? false));
    }).catch(() => {});
  }, [accessToken, success]);

  const handleWithdraw = async () => {
    setError('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) {
      setError('Enter at least $1');
      return;
    }
    const cents = Math.round(amt * 100);
    if (balanceCents !== null && cents > balanceCents) {
      setError('Insufficient balance');
      return;
    }
    if (!accessToken || !API_URL) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/p2p/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Withdrawal failed');
        return;
      }
      setSuccess(true);
      setAmount('');
    } finally {
      setWithdrawing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
          <h1 className="text-xl font-semibold text-[var(--drift-ink)] tracking-tight">Withdraw</h1>
        </header>
        <div className="px-5 py-12 text-center">
          <p className="text-[var(--drift-ink-muted)] mb-6">Sign in to withdraw your balance</p>
          <AuthGate reason="to withdraw" onSuccess={() => {}} onDismiss={() => navigate(-1)} />
        </div>
      </PageShell>
    );
  }

  const balance = balanceCents !== null ? (balanceCents / 100).toFixed(2) : '—';
  const maxAmount = balanceCents !== null ? (balanceCents / 100).toFixed(2) : '0';

  return (
    <PageShell>
      <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
        <h1 className="text-xl font-semibold text-[var(--drift-ink)] tracking-tight">Withdraw</h1>
        <p className="text-sm text-[var(--drift-ink-muted)] mt-1">Move money to your bank account</p>
      </header>

      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="p-5 rounded-[var(--drift-radius-xl)] bg-[var(--drift-surface)] border border-[var(--drift-border)] mb-6">
          <p className="text-xs uppercase tracking-wider text-[var(--drift-ink-subtle)]">Available balance</p>
          <p className="text-3xl font-bold text-[var(--drift-ink)] mt-1">${balance}</p>
        </div>

        {!hasPayoutAccount ? (
          <div className="p-4 rounded-[var(--drift-radius-lg)] bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
            <p className="font-medium mb-1">Add bank account</p>
            <p className="mb-4">Link a bank account in Settings to withdraw.</p>
            <Button variant="secondary" onClick={() => navigate('/me')} icon={<Landmark className="w-4 h-4" />}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <>
            {success && (
              <div className="p-4 rounded-[var(--drift-radius-lg)] bg-green-50 border border-green-200 text-green-800 text-sm mb-6">
                Withdrawal initiated. Funds arrive in 2–3 business days.
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--drift-ink)] mb-2">Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-[var(--drift-ink-muted)]">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
                  placeholder="0"
                  className="flex-1 px-4 py-3 rounded-[var(--drift-radius-lg)] border border-[var(--drift-border)] bg-[var(--drift-surface)] text-[var(--drift-ink)] text-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount(maxAmount)}
                className="mt-2 text-sm text-[var(--drift-accent)] hover:underline"
              >
                Withdraw all (${maxAmount})
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <Button
              fullWidth
              onClick={handleWithdraw}
              disabled={withdrawing || !amount || parseFloat(amount) < 1 || (balanceCents !== null && Math.round(parseFloat(amount || '0') * 100) > balanceCents)}
              icon={<ArrowDownToLine className="w-4 h-4" />}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw to bank'}
            </Button>
          </>
        )}
      </div>
    </PageShell>
  );
}
