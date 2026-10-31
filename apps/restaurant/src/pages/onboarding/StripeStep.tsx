import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { config } from '../../lib/config';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectComponentsProvider, ConnectAccountOnboarding } from '@stripe/react-connect-js';

interface StripeStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CONNECT_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Express Connect. Drift collects the business name and email, then Stripe's
 * hosted or embedded onboarding collects identity and the bank account.
 * In test mode a second button provisions a verified sandbox merchant so the
 * payment and payout flow can be exercised without the hosted form.
 */
export function StripeStep({ restaurantId, data, updateData, onNext, onPrev }: StripeStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    fullName: '',
  });

  useEffect(() => {
    const profile = localStorage.getItem('drift-user-profile');
    let merged: any = { ...data };
    if (profile) {
      try {
        merged = { ...JSON.parse(profile), ...data };
      } catch {
        /* ignore broken profile cache */
      }
    }
    const restaurantName = merged.restaurantName || merged.businessName || merged.name || '';
    setFormData((prev) => ({
      email: merged.email || prev.email,
      businessName: restaurantName || prev.businessName,
      fullName: merged.fullName || prev.fullName,
    }));
  }, [data]);

  useEffect(() => {
    fetch(`${config.apiUrl}/api/stripe/mode`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) return;
        setTestMode(!!body.testMode);
        if (typeof body.feeRate === 'number') setFeeRate(body.feeRate);
      })
      .catch(() => undefined);
  }, []);

  const submit = async (completeInTestMode: boolean) => {
    setError(null);
    if (!formData.email.trim() || !formData.businessName.trim()) {
      setError('Business name and email are required.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('drift-token');
      const res = await fetch(`${config.apiUrl}/api/stripe/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          restaurantId,
          email: formData.email.trim(),
          businessName: formData.businessName.trim(),
          fullName: formData.fullName.trim() || undefined,
          completeInTestMode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not start Stripe Connect.');
        return;
      }
      if (json.accountId) updateData({ stripeAccountId: json.accountId });
      if (json.chargesEnabled) {
        onNext();
        return;
      }
      if (json.embeddedClientSecret && CONNECT_PUBLISHABLE_KEY) {
        setEmbeddedClientSecret(json.embeddedClientSecret);
        setShowEmbedded(true);
        return;
      }
      if (json.onboardingUrl) {
        window.location.href = json.onboardingUrl as string;
        return;
      }
      setError('Stripe did not return an onboarding link. Check Connect settings in the Dashboard.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const feeLabel = feeRate == null ? '2.5%' : `${(feeRate * 100).toFixed(2).replace(/\.00$/, '')}%`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6">
        <h2 className="text-2xl font-light mb-2">Get paid</h2>
        <p className="text-sm text-gray-600 mb-6">
          Stripe holds the bank account and identity check. Drift never stores the account number.
          Diners pay the restaurant directly. Drift keeps {feeLabel}. Stripe’s card fee (2.9% + 30¢) comes out of the restaurant balance, not Drift’s.
        </p>

        {error && (
          <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <Input
            label="Business name"
            required
            value={formData.businessName}
            onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="Owner name"
            value={formData.fullName}
            onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onPrev} className="flex-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Connecting…' : <>Continue with Stripe <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </form>

        {testMode && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-950 mb-3">
              Test mode is on. Create a sandbox merchant to charge test cards and pay the restaurant out
              without Stripe's hosted form. Routing <span className="font-mono">110000000</span>, account{' '}
              <span className="font-mono">000123456789</span>. No real money moves.
            </p>
            <Button type="button" variant="secondary" disabled={loading} onClick={() => submit(true)}>
              Use a Stripe test account
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock className="w-3 h-3" />
        <span>Bank details are collected by Stripe</span>
      </div>

      {showEmbedded && embeddedClientSecret && (
        <EmbeddedStripeOnboardingModal
          clientSecret={embeddedClientSecret}
          onClose={() => {
            setShowEmbedded(false);
            setEmbeddedClientSecret(null);
            setError('Stripe setup is not finished. Continue with Stripe when you are ready. Card payments stay off until charges are enabled.');
          }}
        />
      )}
    </motion.div>
  );
}

function EmbeddedStripeOnboardingModal({
  clientSecret,
  onClose,
}: {
  clientSecret: string;
  onClose: () => void;
}) {
  const [connectInstance, setConnectInstance] = useState<any | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!CONNECT_PUBLISHABLE_KEY) {
      setErr('Stripe Connect is not configured.');
      return;
    }
    Promise.resolve(loadConnectAndInitialize({
      publishableKey: CONNECT_PUBLISHABLE_KEY,
      fetchClientSecret: async () => clientSecret,
      appearance: { overlays: 'dialog' },
    }) as Promise<unknown> | unknown)
      .then((instance) => {
        if (!cancelled) {
          setConnectInstance(instance);
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e?.message || 'Failed to load Stripe Connect.');
      });
    return () => {
      cancelled = true;
    };
  }, [clientSecret]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Finish payment setup</h3>
          <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
          {!ready || !connectInstance ? (
            <p className="text-sm text-gray-500">Loading secure Stripe onboarding…</p>
          ) : (
            <ConnectComponentsProvider connectInstance={connectInstance}>
              <ConnectAccountOnboarding onExit={onClose} />
            </ConnectComponentsProvider>
          )}
        </div>
      </div>
    </div>
  );
}
