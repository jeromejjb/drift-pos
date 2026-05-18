import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sessionExpiredMessage, isSessionExpiredError, toConnectionError } from '../lib/userErrors';
import { Button } from './ui/Button';
import { API_URL, STRIPE_PUBLISHABLE_KEY } from '../lib/api';
import { InlineError } from './ui/InlineError';
import { AuthForm } from './auth/AuthForm';

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  showDone?: boolean;
}

/**
 * Add card modal: auth (if needed) → Stripe card form → success.
 * Uses shared AuthForm for sign-in/sign-up.
 */
export function AddCardModal({ isOpen, onClose, onSuccess, showDone }: AddCardModalProps) {
  const { user, accessToken, isAuthConfigured, refreshSession, signOut } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const needsAuth = !user || !accessToken;

  useEffect(() => {
    if (!isOpen) return;
    setClientSecret(null);
    setError('');
    setSaved(!!showDone);
  }, [isOpen, showDone]);

  useEffect(() => {
    if (!isOpen || needsAuth || !accessToken) return;
    let cancelled = false;
    const fetchSetupIntent = async (token: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(`${API_URL}/api/diner/setup-intent`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        return { res, data };
      } finally {
        clearTimeout(timeoutId);
      }
    };
    (async () => {
      try {
        let token = accessToken;
        let { res, data } = await fetchSetupIntent(token);
        if (cancelled) return;
        if (res.status === 401 && (data?.code === 'INVALID_TOKEN' || data?.code === 'AUTH_FAILED')) {
          const newToken = await refreshSession();
          if (cancelled) return;
          if (newToken) {
            const retry = await fetchSetupIntent(newToken);
            if (cancelled) return;
            ({ res, data } = retry);
          } else {
            setError(sessionExpiredMessage());
            return;
          }
        }
        if (!res.ok) {
          setError((data?.code === 'INVALID_TOKEN' || data?.code === 'AUTH_FAILED') ? sessionExpiredMessage() : (data.error || 'Failed to load'));
          return;
        }
        if (data.clientSecret) setClientSecret(data.clientSecret);
      } catch {
        if (!cancelled) setError(toConnectionError(API_URL));
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, needsAuth, accessToken, refreshSession, signOut]);

  const handleCardSuccess = () => {
    setClientSecret(null);
    setSaved(true);
    onSuccess?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[var(--drift-ink)]/50 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-md bg-[var(--drift-surface)] rounded-t-[var(--drift-radius-2xl)] sm:rounded-[var(--drift-radius-2xl)] shadow-[var(--drift-shadow-lg)] animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--drift-surface)] border-b border-[var(--drift-border)] px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-[var(--drift-ink)]">
            {saved ? 'Card saved' : needsAuth ? 'Sign in to add card' : 'Add card'}
          </h2>
          <button type="button" onClick={onClose} className="p-2.5 -mr-2.5 rounded-[var(--drift-radius)] text-[var(--drift-ink-muted)] hover:bg-[var(--drift-surface-overlay)] hover:text-[var(--drift-ink)] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 pb-10 safe-bottom">
          {saved ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[var(--drift-accent-muted)] flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[var(--drift-accent)]" strokeWidth={2.5} />
              </div>
              <p className="text-[var(--drift-ink)] font-medium">You're all set</p>
              <Button className="mt-4" fullWidth variant="primary" onClick={onClose}>Done</Button>
            </div>
          ) : needsAuth ? (
            !isAuthConfigured ? (
              <p className="text-sm text-[var(--drift-ink-muted)]">Sign-in isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.</p>
            ) : (
              <AuthForm onSuccess={() => {}} compact />
            )
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CardForm onSuccess={handleCardSuccess} onCancel={() => setClientSecret(null)} />
            </Elements>
          ) : (
            <div className="py-8 text-center">
              {error ? (
                <div className="space-y-4">
                  <InlineError
                    message={error}
                    onRetry={isSessionExpiredError(error) ? undefined : () => { setError(''); setClientSecret(null); }}
                    action={isSessionExpiredError(error) ? (
                      <Button
                        fullWidth
                        onClick={() => { setError(''); onClose(); window.dispatchEvent(new CustomEvent('drift:session-expired')); }}
                      >
                        Sign in again
                      </Button>
                    ) : undefined}
                  />
                </div>
              ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-accent)] border-t-transparent mx-auto" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErr('');
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/?card_saved=1` },
    });
    setProcessing(false);
    if (error) {
      setErr(error.message || 'Something went wrong');
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: { type: 'accordion', radios: 'never', spacedAccordionItems: false } }} />
      {err && <InlineError message={err} />}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Back</Button>
        <Button type="submit" disabled={!stripe || processing} className="flex-1">{processing ? 'Saving…' : 'Save card'}</Button>
      </div>
    </form>
  );
}
