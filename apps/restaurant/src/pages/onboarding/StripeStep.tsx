import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Building2,
  Lock,
  Calendar,
  Hash,
  AlertCircle,
} from 'lucide-react';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CONNECT_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export function StripeStep({ restaurantId, data, updateData, onNext, onPrev }: StripeStepProps) {
  const [loading, setLoading] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    fullName: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
    },
    dob: { month: '', day: '', year: '' },
    ssnLast4: '',
    bankAccount: {
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
    },
    tosAccepted: false,
  });

  // Load from onboarding data and profile
  useEffect(() => {
    const profile = localStorage.getItem('drift-user-profile');
    let merged: any = { ...data };
    if (profile) {
      try {
        merged = { ...JSON.parse(profile), ...data };
      } catch (_) {}
    }
    const restaurantName = merged.restaurantName || merged.businessName || merged.name || '';
    setFormData((prev) => ({
      ...prev,
      email: merged.email || prev.email,
      businessName: restaurantName || prev.businessName,
      fullName: merged.fullName || prev.fullName,
      phone: merged.phone || prev.phone,
      address: {
        line1: merged.address?.line1 ?? (typeof merged.address === 'string' ? merged.address : prev.address.line1),
        city: merged.address?.city ?? prev.address.city,
        state: merged.address?.state ?? prev.address.state,
        postal_code: merged.address?.postal_code ?? prev.address.postal_code,
      },
    }));
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.tosAccepted) {
      setError('Please accept the Connected Account Agreement.');
      return;
    }

    const { dob, ssnLast4, bankAccount } = formData;
    if (!dob.month || !dob.day || !dob.year) {
      setError('Please enter your date of birth.');
      return;
    }
    const dayNum = parseInt(dob.day, 10);
    const yearNum = parseInt(dob.year, 10);
    const maxYear = new Date().getFullYear() - 18;
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError('Day of birth must be between 1 and 31.');
      return;
    }
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > maxYear) {
      setError(`Year of birth must be between 1900 and ${maxYear}.`);
      return;
    }
    if (!formData.address.line1?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.postal_code?.trim()) {
      setError('Please enter your full payout address (street, city, state, ZIP).');
      return;
    }
    const zipDigits = formData.address.postal_code.replace(/\D/g, '');
    if (zipDigits.length !== 5 && zipDigits.length !== 9) {
      setError('ZIP must be 5 or 9 digits.');
      return;
    }
    // SSN last 4 is strongly recommended, but to keep onboarding light we don't hard-block
    // if they leave it blank. Stripe will prompt for it in the hosted onboarding flow if needed.
    const ssnDigits = ssnLast4.replace(/\D/g, '');
    if (ssnDigits && ssnDigits.length !== 4) {
      setError('Last 4 of SSN must be exactly 4 digits, or leave it blank for now.');
      return;
    }
    if (!bankAccount.routingNumber || !bankAccount.accountNumber || !bankAccount.accountHolderName) {
      setError('Please fill in all bank account fields.');
      return;
    }
    const routingDigits = bankAccount.routingNumber.replace(/\D/g, '');
    if (routingDigits.length !== 9) {
      setError('Routing number must be 9 digits.');
      return;
    }

    setLoading(true);
    setLoadingSlow(false);
    // Show \"this may take a moment\" sooner, and cap request duration
    let slowTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => setLoadingSlow(true), 3000);
    try {
      const token = localStorage.getItem('drift-token');
      const controller = new AbortController();
      // Allow more time for Stripe + network on first-time account creation
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);
      const res = await fetch(`${config.apiUrl}/api/stripe/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          restaurantId,
          email: formData.email,
          businessName: formData.businessName,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          address: {
            line1: formData.address.line1.trim(),
            city: formData.address.city.trim(),
            state: formData.address.state.trim(),
            postal_code: formData.address.postal_code.replace(/\D/g, ''),
          },
          bankAccount: {
            accountHolderName: formData.bankAccount.accountHolderName,
            routingNumber: routingDigits,
            accountNumber: formData.bankAccount.accountNumber.replace(/\D/g, ''),
          },
          dob: {
            month: formData.dob.month,
            day: formData.dob.day,
            year: formData.dob.year,
          },
          ssnLast4: ssnDigits,
          tosAcceptance: {
            date: Math.floor(Date.now() / 1000),
          },
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (slowTimer) clearTimeout(slowTimer);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          json.error ||
          json.message ||
          (json.missing?.length ? `Missing: ${json.missing.join(', ')}` : 'Failed to connect bank account.');
        setError(msg);
        setLoading(false);
        return;
      }

      if (json.accountId) {
        updateData({ stripeAccountId: json.accountId });
      }

      // Prefer embedded onboarding in a modal if we have a client secret and Connect is configured.
      if (json.embeddedClientSecret && CONNECT_PUBLISHABLE_KEY) {
        setEmbeddedClientSecret(json.embeddedClientSecret as string);
        setShowEmbedded(true);
        return;
      }

      // Fallback: If the API returned a Stripe onboarding URL, send the user there to finish any remaining details.
      if (json.onboardingUrl) {
        window.location.href = json.onboardingUrl as string;
        return;
      }

      onNext();
    } catch (err) {
      if (slowTimer) clearTimeout(slowTimer);
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : err instanceof Error
            ? err.message
            : 'Network error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatSsn = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, ssnLast4: d }));
  };

  const formatRouting = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({
      ...prev,
      bankAccount: { ...prev.bankAccount, routingNumber: d },
    }));
  };

  const formatAccountNumber = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 17);
    setFormData((prev) => ({
      ...prev,
      bankAccount: { ...prev.bankAccount, accountNumber: d },
    }));
  };

  const formatDobDay = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 2);
    setFormData((prev) => ({ ...prev, dob: { ...prev.dob, day: d } }));
  };

  const formatDobYear = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, dob: { ...prev.dob, year: d } }));
  };

  const formatPostalCodeStripe = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, postal_code: d },
    }));
  };

  const formatPhoneStripe = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    const formatted =
      d.length <= 3
        ? d
        : d.length <= 6
          ? `(${d.slice(0, 3)}) ${d.slice(3)}`
          : `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const routingDigits = formData.bankAccount.routingNumber.replace(/\D/g, '');
  const accountDigits = formData.bankAccount.accountNumber.replace(/\D/g, '');
  const postalDigits = formData.address.postal_code.replace(/\D/g, '');
  const phoneDigits = formData.phone.replace(/\D/g, '');
  const dobDayNum = parseInt(formData.dob.day, 10);
  const dobYearNum = parseInt(formData.dob.year, 10);
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 120;
  const maxYear = currentYear - 18;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Payment account</h2>
        <p className="text-gray-400">Set up in minutes. Connect your bank to receive diner payments directly. Bank-level security.</p>
      </div>

      {error && (
        <Card padding="md" className="mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <Card padding="xl" className="border-2 border-gray-100 hover:border-gray-200 transition-all">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Business name"
              required
              value={formData.businessName}
              onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))}
              placeholder="e.g. Joe's Pizza"
              icon={<Building2 className="w-4 h-4" />}
            />
            <Input
              label="Full legal name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Account holder name"
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={formData.phone}
            onChange={(e) => formatPhoneStripe(e.target.value)}
            placeholder="(555) 123-4567"
            error={
              phoneDigits.length > 0 && phoneDigits.length !== 10
                ? 'Must be 10 digits'
                : undefined
            }
          />

          <div>
            <label className="block text-sm text-gray-500 mb-2">Payout address <span className="text-red-500">*</span></label>
            {formData.address.line1 && (
              <p className="text-xs text-green-600 mb-2">Pre-filled from your business address. Edit if needed.</p>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Street address"
                required
                value={formData.address.line1}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    address: { ...p.address, line1: e.target.value },
                  }))
                }
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  placeholder="City"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      address: { ...p.address, city: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="State"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      address: { ...p.address, state: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="ZIP (5 or 9 digits)"
                  value={formData.address.postal_code}
                  onChange={(e) => formatPostalCodeStripe(e.target.value)}
                  error={
                    postalDigits.length > 0 && postalDigits.length !== 5 && postalDigits.length !== 9
                      ? 'ZIP must be 5 or 9 digits'
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of birth <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select
                required
                value={formData.dob.month}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    dob: { ...p.dob, month: e.target.value },
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={2}
                  placeholder="Day"
                  value={formData.dob.day}
                  onChange={(e) => formatDobDay(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-black ${
                    formData.dob.day && (isNaN(dobDayNum) || dobDayNum < 1 || dobDayNum > 31)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                {formData.dob.day && (isNaN(dobDayNum) || dobDayNum < 1 || dobDayNum > 31) && (
                  <p className="text-xs text-red-500 mt-1">Day must be 1–31</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  placeholder="Year"
                  value={formData.dob.year}
                  onChange={(e) => formatDobYear(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-black ${
                    formData.dob.year &&
                    (isNaN(dobYearNum) || dobYearNum < minYear || dobYearNum > maxYear)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                {formData.dob.year &&
                  (isNaN(dobYearNum) || dobYearNum < minYear || dobYearNum > maxYear) && (
                    <p className="text-xs text-red-500 mt-1">
                      Year must be {minYear}–{maxYear}
                    </p>
                  )}
              </div>
            </div>
          </div>

          <Input
            label="Last 4 of SSN"
            placeholder="1234"
            maxLength={4}
            value={formData.ssnLast4}
            onChange={(e) => formatSsn(e.target.value)}
            icon={<Hash className="w-4 h-4" />}
            error={
              (() => {
                const digits = formData.ssnLast4.replace(/\D/g, '');
                if (digits.length > 0 && digits.length !== 4) {
                  return 'Must be 4 digits';
                }
                // Allow 0000 explicitly for test mode; block other repeated digits
                if (digits.length === 4 && /^(\d)\1+$/.test(digits) && digits !== '0000') {
                  return 'Repeated digits (e.g. 2222) are not accepted. Use your real last 4, or 0000 for testing.';
                }
                return undefined;
              })()
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Use your real last 4 digits. For test mode you can use 0000.
          </p>

          <div className="pt-2 pb-2 border-t border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Bank account</p>
            <div className="space-y-3">
              <Input
                label="Account holder name"
                required
                value={formData.bankAccount.accountHolderName}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    bankAccount: { ...p.bankAccount, accountHolderName: e.target.value },
                  }))
                }
                placeholder="Legal name on account"
              />
              <Input
                label="Routing number (9 digits)"
                required
                value={formData.bankAccount.routingNumber}
                onChange={(e) => formatRouting(e.target.value)}
                placeholder="021000021"
                maxLength={9}
                error={
                  routingDigits.length > 0 && routingDigits.length !== 9
                    ? 'Must be exactly 9 digits'
                    : undefined
                }
              />
              <Input
                label="Account number (4–17 digits)"
                required
                type="password"
                autoComplete="off"
                value={formData.bankAccount.accountNumber}
                onChange={(e) => formatAccountNumber(e.target.value)}
                placeholder="Account number"
                error={
                  accountDigits.length > 0 && (accountDigits.length < 4 || accountDigits.length > 17)
                    ? 'Must be 4–17 digits'
                    : undefined
                }
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.tosAccepted}
              onChange={(e) => setFormData((p) => ({ ...p, tosAccepted: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-600">
              I agree to the Connected Account Agreement and authorize Drift to send payouts to my bank account.
            </span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onPrev} className="flex-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                loading ||
                (formData.dob.day && (isNaN(dobDayNum) || dobDayNum < 1 || dobDayNum > 31)) ||
                (formData.dob.year && (isNaN(dobYearNum) || dobYearNum < minYear || dobYearNum > maxYear)) ||
                (!formData.address.line1?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.postal_code?.trim() || (postalDigits.length !== 5 && postalDigits.length !== 9)) ||
                (routingDigits.length > 0 && routingDigits.length !== 9) ||
                (accountDigits.length > 0 && (accountDigits.length < 4 || accountDigits.length > 17)) ||
                (phoneDigits.length > 0 && phoneDigits.length !== 10) ||
                (() => {
                  const digits = formData.ssnLast4.replace(/\D/g, '');
                  // Disallow repeated digits except 0000 (allowed in test mode)
                  return digits.length === 4 && /^(\d)\1+$/.test(digits) && digits !== '0000';
                })()
              }
            >
              {loading ? 'Connecting…' : <>Continue <ChevronRight className="w-4 h-4" /></>}
            </Button>
          </div>
          {loading && loadingSlow && (
            <p className="mt-3 text-center text-sm text-gray-500">
              This may take a moment. Please don&apos;t close this page.
            </p>
          )}
        </form>
      </Card>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock className="w-3 h-3" />
        <span>Encrypted and secure</span>
      </div>

      {showEmbedded && embeddedClientSecret && (
        <EmbeddedStripeOnboardingModal
          clientSecret={embeddedClientSecret}
          onClose={() => {
            setShowEmbedded(false);
            setEmbeddedClientSecret(null);
            // Let the next step / complete page verify account status.
            onNext();
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
    loadConnectAndInitialize({
      publishableKey: CONNECT_PUBLISHABLE_KEY,
      fetchClientSecret: async () => clientSecret,
      appearance: {
        overlays: 'dialog',
      },
    })
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
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {err && (
            <p className="text-sm text-red-600 mb-2">{err}</p>
          )}
          {!ready || !connectInstance ? (
            <p className="text-sm text-gray-500">Loading secure Stripe onboarding…</p>
          ) : (
            <ConnectComponentsProvider connectInstance={connectInstance}>
              <ConnectAccountOnboarding
                onExit={onClose}
                // Stripe handles its own internal loading state; we rely on the
                // outer `ready` flag above to gate initial render.
              />
            </ConnectComponentsProvider>
          )}
        </div>
      </div>
    </div>
  );
}
