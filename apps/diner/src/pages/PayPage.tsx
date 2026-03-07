import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Send, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { InlineError } from '../components/ui/InlineError';
import { PageShell } from '../components/layout/PageShell';
import { AuthGate } from '../components/auth/AuthGate';
import { API_URL, STRIPE_PUBLISHABLE_KEY, isStripeTestMode } from '../lib/api';
import { toP2PError, toPaymentError, toConnectionError, sessionExpiredMessage } from '../lib/userErrors';

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const AMOUNT_CHIPS = [5, 10, 20, 50, 100];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, accessToken, loading: authLoading, refreshSession, signOut } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showHowToTest, setShowHowToTest] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientIdResolved, setRecipientIdResolved] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [transfers, setTransfers] = useState<{ sent: any[]; received: any[] } | null>(null);
  const [successSent, setSuccessSent] = useState<{ amount: string; to: string } | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken || !API_URL) return;
    const fetchTransfers = async (token: string) => {
      const r = await fetch(`${API_URL}/api/p2p/transfers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = r.ok ? await r.json().catch(() => null) : null;
      if (data) setTransfers(data);
      return { status: r.status };
    };
    fetchTransfers(accessToken).then(async (result) => {
      if (result.status === 401) {
        const newToken = await refreshSession();
        if (newToken) fetchTransfers(newToken);
      }
    }).catch(() => {});
  }, [accessToken, refreshSession]);

  // Pre-fill from query params (e.g. /pay?amount=5&recipient=user@email.com or recipient_id=UUID for Taproom/partner apps)
  useEffect(() => {
    const amt = searchParams.get('amount');
    const recipient = searchParams.get('recipient');
    const rid = searchParams.get('recipient_id');
    const rt = searchParams.get('return_to');
    const hasParams = amt || recipient || rid || rt;
    if (!hasParams) return;
    if (amt && !isNaN(parseFloat(amt)) && parseFloat(amt) >= 0.5) {
      setAmount(amt);
      setCustomAmount('');
    }
    if (recipient && recipient.includes('@')) {
      setRecipientEmail(recipient);
    }
    if (rid && typeof rid === 'string' && UUID_REGEX.test(rid.trim())) {
      setRecipientId(rid.trim());
    }
    if (rt && typeof rt === 'string' && rt.startsWith('http')) {
      setReturnTo(rt);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('amount');
    next.delete('recipient');
    next.delete('recipient_id');
    next.delete('return_to');
    if (next.toString()) setSearchParams(next, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Resolve recipient_id via API when signed in (partner apps use recipient_id instead of email)
  useEffect(() => {
    if (!accessToken || !API_URL || !recipientId || recipientIdResolved) return;
    const fetchRecipient = async (token: string) => {
      const r = await fetch(`${API_URL}/api/p2p/recipient-info?recipient_id=${encodeURIComponent(recipientId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        setRecipientId(null);
        return;
      }
      const data = await r.json().catch(() => null);
      if (data?.email || data?.name) {
        setRecipientEmail(data.email || data.name || '');
        setRecipientIdResolved(true);
      } else {
        setRecipientId(null);
      }
    };
    fetchRecipient(accessToken).catch(() => setRecipientId(null));
  }, [accessToken, API_URL, recipientId, recipientIdResolved]);

  // Focus amount field when Pay screen opens so numeric keyboard shows on mobile
  useEffect(() => {
    if (user && !clientSecret && !successSent) {
      const t = setTimeout(() => amountInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [user, clientSecret, successSent]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell withNav>
        <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
            {isStripeTestMode && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Test mode
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-1 tracking-tight">Pay</h1>
          <p className="text-sm text-[var(--drift-ink-muted)] mt-1.5 max-w-sm">
            Send money to friends or split the bill. Sign in when you're ready to send.
          </p>
        </header>

        <div className="px-5 py-12 max-w-md mx-auto">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-28 h-28 rounded-[var(--drift-radius-2xl)] bg-[var(--drift-accent)] flex items-center justify-center mb-8 shadow-[0_8px_32px_var(--drift-accent-glow)]">
              <Send className="w-14 h-14 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--drift-ink)] tracking-tight">
              Send money to anyone
            </h2>
            <p className="text-[var(--drift-ink-muted)] text-[15px] mt-3 max-w-xs leading-relaxed">
              Pay friends, split bills, or get paid. No account needed to dine — sign in only when you send.
            </p>
            <Button
              className="mt-10 min-w-[220px] py-4"
              onClick={() => setShowAuthGate(true)}
              icon={<Send className="w-5 h-5" />}
            >
              Send money
            </Button>
          </div>

          <p className="text-center text-sm text-[var(--drift-ink-subtle)] mt-14">
            Recent activity appears here after you sign in.
          </p>
        </div>

        {showAuthGate && (
          <AuthGate
            reason="to send money"
            onSuccess={() => setShowAuthGate(false)}
            onDismiss={() => setShowAuthGate(false)}
          />
        )}
      </PageShell>
    );
  }

  const displayAmount = customAmount ? customAmount : amount;
  const amountNum = parseFloat(displayAmount || '0');
  const isValidAmount = !isNaN(amountNum) && amountNum >= 0.5;
  const hasRecipient = recipientId || recipientEmail.trim();

  const startPayment = async () => {
    setError('');
    const amt = customAmount ? parseFloat(customAmount) : parseFloat(amount);
    const hasRecipient = recipientId || recipientEmail.trim();
    if (!hasRecipient) {
      setError('Enter recipient email');
      return;
    }
    if (isNaN(amt) || amt < 0.5) {
      setError('Enter at least $0.50');
      return;
    }
    let token = accessToken;
    if (!token || !API_URL) {
      setError(sessionExpiredMessage());
      return;
    }
    const doRequest = async (t: string) => {
      const res = await fetch(`${API_URL}/api/p2p/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          ...(recipientId
            ? { recipientId }
            : { recipientEmail: recipientEmail.trim().toLowerCase() }),
          amount: amt,
          note: note.trim() || undefined,
        }),
      });
      return { res, data: await res.json().catch(() => ({})) };
    };
    try {
      let { res, data } = await doRequest(token);
      if (res.status === 401 && data?.code === 'INVALID_TOKEN') {
        const newToken = await refreshSession();
        if (newToken) {
          const retry = await doRequest(newToken);
          ({ res, data } = retry);
        } else {
          await signOut();
          setError(sessionExpiredMessage());
          return;
        }
      }
      if (!res.ok) {
        setError(toP2PError(data, res.status));
        return;
      }
      if (data.usedBalance) {
        onPaymentSuccess();
        return;
      }
      if (data.clientSecret) setClientSecret(data.clientSecret);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Pay API error:', err);
      setError(toConnectionError(API_URL));
    }
  };

  const onPaymentSuccess = () => {
    const amt = customAmount || amount;
    const to = recipientEmail.trim() || (recipientId ? 'recipient' : '');
    setClientSecret(null);
    setAmount('');
    setCustomAmount('');
    setNote('');
    setRecipientEmail('');
    setRecipientId(null);
    setRecipientIdResolved(false);
    setSuccessSent({ amount: amt, to });
    if (accessToken && API_URL) {
      fetch(`${API_URL}/api/p2p/transfers`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setTransfers(data))
        .catch(() => {});
    }
  };

  const hasActivity = (transfers?.sent?.length || 0) + (transfers?.received?.length || 0) > 0;
  const recentList = hasActivity
    ? [...(transfers?.sent || []), ...(transfers?.received || [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    : [];
  const recentEmails = Array.from(
    new Set(
      recentList
        .map((t: any) => {
          const isSent = !!t.amountCents && t.senderId === user?.id;
          const other = isSent ? t.recipient : t.sender;
          return other?.email;
        })
        .filter(Boolean)
    )
  ) as string[];

  // Success state
  if (successSent) {
    return (
      <PageShell>
        <div className="px-5 py-6 max-w-md mx-auto">
          <div className="text-center py-8 animate-success-pop">
            <div className="w-24 h-24 rounded-full bg-[var(--drift-accent-muted)] flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-[var(--drift-accent)]" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--drift-ink)]">Sent</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--drift-ink)]">
              ${Number(successSent.amount).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-[var(--drift-ink-muted)]">to {successSent.to}</p>
            <div className="mt-10 flex flex-col gap-3 items-center">
              {returnTo && (
                <a
                  href={returnTo}
                  className="text-sm font-medium text-[var(--drift-accent)] hover:underline underline-offset-2"
                >
                  Back to Taproom
                </a>
              )}
              <Button
                className="min-w-[220px]"
                variant="primary"
                onClick={() => setSuccessSent(null)}
                icon={<Send className="w-5 h-5" />}
              >
                Send another
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Main send flow — minimal: amount, who, pay
  return (
    <PageShell>
      <header className="px-5 pt-5 pb-4 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--drift-ink)] tracking-tight">Pay</h1>
          <div className="flex items-center gap-2">
            {returnTo && (
              <a
                href={returnTo}
                className="text-sm font-medium text-[var(--drift-accent)] hover:underline underline-offset-2"
              >
                Back to Taproom
              </a>
            )}
            {isStripeTestMode && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                Test
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 py-8 max-w-md mx-auto">
        {/* Single flow: amount → who → pay */}
        <div className="animate-scale-in">
          {/* Amount: hero */}
          <div className="mb-8">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl font-semibold text-[var(--drift-ink-muted)]">$</span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                autoComplete="off"
                value={customAmount || (amount ? String(amount) : '')}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, '').slice(0, 10);
                  setCustomAmount(v);
                  if (!v) setAmount('');
                }}
                onFocus={() => customAmount || amount ? setCustomAmount(amount || '0') : setCustomAmount('')}
                placeholder="0"
                disabled={!!clientSecret}
                className="w-32 text-5xl font-semibold tabular-nums bg-transparent border-none outline-none text-center text-[var(--drift-ink)] placeholder:text-[var(--drift-ink-subtle)]"
                aria-label="Amount in dollars"
              />
            </div>
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {AMOUNT_CHIPS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!!clientSecret}
                  onClick={() => { setAmount(String(n)); setCustomAmount(''); }}
                  className={`min-w-[3.5rem] py-3 rounded-[var(--drift-radius-pill)] text-sm font-semibold transition-all ${
                    amount === String(n) && !customAmount
                      ? 'bg-[var(--drift-accent)] text-white shadow-[var(--drift-shadow-sm)]'
                      : 'bg-[var(--drift-surface-overlay)] text-[var(--drift-ink)] hover:bg-[var(--drift-border)]'
                  }`}
                >
                  ${n}
                </button>
              ))}
            </div>
          </div>

          {/* Who */}
          <div className="mb-4">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                if (!recipientId) setRecipientEmail(e.target.value);
              }}
              placeholder={recipientId ? 'Resolving…' : 'Who? (email)'}
              disabled={!!clientSecret || !!recipientId}
              className="w-full px-4 py-3.5 rounded-[var(--drift-radius-lg)] border border-[var(--drift-border)] bg-[var(--drift-surface)] text-[var(--drift-ink)] placeholder:text-[var(--drift-ink-subtle)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--drift-accent)]/30 focus:border-[var(--drift-accent)]"
              aria-label="Recipient email"
            />
            {recentEmails.length > 0 && !clientSecret && (
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {recentEmails.slice(0, 4).map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setRecipientEmail(email)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[var(--drift-surface-overlay)] text-[var(--drift-ink-muted)] hover:bg-[var(--drift-border)] hover:text-[var(--drift-ink)] truncate max-w-[130px]"
                  >
                    {email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note: one line, subtle */}
          <div className="mb-5">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              disabled={!!clientSecret}
              className="w-full px-4 py-3 rounded-[var(--drift-radius-lg)] border border-[var(--drift-border)] bg-[var(--drift-surface)] text-[var(--drift-ink)] placeholder:text-[var(--drift-ink-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--drift-accent)]/30 focus:border-[var(--drift-accent)]"
              aria-label="Note"
            />
          </div>

          {error && (
            <InlineError
              message={error}
              onRetry={error.includes('Session expired') ? undefined : startPayment}
              action={error.includes('Session expired') ? (
                <button
                  type="button"
                  onClick={() => { setError(''); setShowAuthGate(true); }}
                  className="text-sm font-medium text-[var(--drift-accent)] hover:underline underline-offset-2"
                >
                  Sign in again
                </button>
              ) : undefined}
              className="mb-4"
            />
          )}

          {!clientSecret && (
            <>
              <Button
                fullWidth
                onClick={startPayment}
                disabled={!hasRecipient || !isValidAmount}
                icon={<Send className="w-5 h-5" />}
                className="py-4 text-base"
              >
                {displayAmount && isValidAmount ? `Send $${Number(displayAmount).toFixed(2)}` : 'Send'}
              </Button>
              <p className="text-center text-xs text-[var(--drift-ink-subtle)] mt-3">Free to send</p>
            </>
          )}

          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <P2PConfirmForm
                amount={displayAmount}
                returnTo={returnTo}
                onSuccess={onPaymentSuccess}
                onCancel={() => setClientSecret(null)}
              />
            </Elements>
          )}
        </div>

        {isStripeTestMode && (
          <p className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowHowToTest(!showHowToTest)}
              className="text-xs text-[var(--drift-ink-subtle)] underline hover:text-[var(--drift-ink)]"
            >
              {showHowToTest ? 'Hide test info' : 'Testing?'}
            </button>
          </p>
        )}
        {isStripeTestMode && showHowToTest && (
          <div className="mt-2 p-3 rounded-[var(--drift-radius)] bg-[var(--drift-surface-overlay)] text-xs text-[var(--drift-ink-muted)] space-y-2">
            <p className="font-medium text-[var(--drift-ink)]">Setup for testing (test@mail.com + $20)</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>From repo root run <code className="bg-black/5 px-1 rounded">npm run dev:pay</code> (starts API + diner together).</li>
              <li>In <code className="bg-black/5 px-1 rounded">apps/diner/.env</code> set <code className="bg-black/5 px-1 rounded">VITE_API_URL=http://localhost:3001</code>. Restart the diner if you change it.</li>
              <li>In <code className="bg-black/5 px-1 rounded">apps/api/.env</code> add <code className="bg-black/5 px-1 rounded">TEST_P2P_RECIPIENT_EMAIL=test@mail.com</code>. Restart the API if you change it.</li>
              <li>Use card 4242 4242 4242 4242 at checkout.</li>
            </ol>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-xs font-medium text-[var(--drift-ink-subtle)] uppercase tracking-wider mb-2">Recent</h2>
          {hasActivity ? (
            <ul className="rounded-[var(--drift-radius-lg)] bg-[var(--drift-surface)] border border-[var(--drift-border)] overflow-hidden divide-y divide-[var(--drift-border)]">
              {recentList.map((t: any) => {
                const isSent = !!t.amountCents && t.senderId === user?.id;
                const other = isSent ? t.recipient : t.sender;
                return (
                  <li key={t.id} className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--drift-surface-overlay)] flex items-center justify-center flex-shrink-0">
                        {isSent ? <ArrowUpRight className="w-3.5 h-3.5 text-[var(--drift-ink-muted)]" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--drift-accent)]" />}
                      </div>
                      <p className="text-sm font-medium text-[var(--drift-ink)] truncate">
                        {isSent ? 'To ' : 'From '}{other?.email || '—'}
                      </p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${isSent ? 'text-[var(--drift-ink)]' : 'text-[var(--drift-accent)]'}`}>
                      {isSent ? '-' : '+'}${((t.amountCents || 0) / 100).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--drift-ink-subtle)] py-4 text-center">No sends yet</p>
          )}
        </section>
      </div>

      {showAuthGate && (
        <AuthGate
          reason="to continue"
          onSuccess={() => setShowAuthGate(false)}
          onDismiss={() => setShowAuthGate(false)}
        />
      )}
    </PageShell>
  );
}

function P2PConfirmForm({
  amount,
  returnTo,
  onSuccess,
  onCancel,
}: {
  amount: string;
  returnTo: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState('');

  const returnUrl = returnTo
    ? `${window.location.origin}/pay/return?return_to=${encodeURIComponent(returnTo)}`
    : `${window.location.origin}/pay/return`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErr('');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    setProcessing(false);
    if (error) {
      setErr(toPaymentError(error.message));
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-[var(--drift-border)]">
      <PaymentElement options={{ layout: { type: 'accordion', radios: 'never', spacedAccordionItems: false } }} />
      {err && <InlineError message={err} />}
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Back
          </Button>
        )}
        <Button
          type="submit"
          fullWidth={!onCancel}
          disabled={!stripe || processing}
        >
          {processing ? 'Processing…' : `Send $${amount || '0'}`}
        </Button>
      </div>
    </form>
  );
}
