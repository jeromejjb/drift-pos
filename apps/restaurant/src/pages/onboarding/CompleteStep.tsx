import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { config } from '../../lib/config';

interface CompleteStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function CompleteStep({ restaurantId, data }: CompleteStepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'ready' | 'incomplete' | 'unknown'>('loading');
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // On mount, check whether the Stripe account is fully onboarded so we don't
  // tell the restaurant they're "all set" if payouts still need attention.
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const token = localStorage.getItem('drift-token');
        const baseHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const restaurantRes = await fetch(`${config.apiUrl}/api/restaurants/${restaurantId}`, {
          headers: baseHeaders,
        });
        if (!restaurantRes.ok) {
          setPaymentStatus('unknown');
          return;
        }
        const restaurant = await restaurantRes.json();
        const accountId: string | null = restaurant.stripeAccount ?? null;
        setStripeAccountId(accountId);

        if (!accountId) {
          setPaymentStatus('incomplete');
          setPaymentMessage('Add your payout details to enable card payments and payouts.');
          return;
        }

        const statusRes = await fetch(`${config.apiUrl}/api/stripe/account-status/${accountId}`, {
          headers: baseHeaders,
        });
        const statusJson = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) {
          setPaymentStatus('unknown');
          setPaymentMessage(statusJson.error || 'Could not load payment account status.');
          return;
        }

        if (statusJson.isOnboardingComplete) {
          setPaymentStatus('ready');
          setPaymentMessage('Payments are ready. You can start taking card payments as soon as your first diners arrive.');
        } else {
          setPaymentStatus('incomplete');
          setPaymentMessage('Quick final step: finish verification in Stripe so payouts can be enabled.');
        }
      } catch (e: any) {
        setPaymentStatus('unknown');
        setPaymentMessage(e?.message || 'Could not verify payment account status.');
      }
    };

    checkPaymentStatus();
  }, [restaurantId]);

  const handleFinishPaymentSetup = () => {
    window.location.href = `/onboarding?restaurantId=${encodeURIComponent(restaurantId)}&step=bank`;
  };

  const handleGoToDashboard = async () => {
    const menu = data?.menu;
    const token = localStorage.getItem('drift-token');
    if (menu?.categories?.length && token) {
      setSaving(true);
      setError(null);
      try {
        const categories = menu.categories.map((cat: any) => ({
          name: cat.name || '',
          items: (cat.items || []).map((item: any) => ({
            name: item.name || '',
            description: item.description || '',
            price: item.price ?? 0
          }))
        }));
        const res = await fetch(`${config.apiUrl}/api/restaurants/${restaurantId}/menu/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ categories })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || 'Failed to save menu');
          setSaving(false);
          return;
        }
      } catch {
        setError('Could not connect. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    window.location.href = `/dashboard/${restaurantId}`;
  };

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-light text-gray-900 mb-4">
        {paymentStatus === 'ready' ? "You're ready to take a table payment" : 'Almost there'}
      </h2>
      
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {paymentStatus === 'ready'
          ? 'Menu, tables, and payouts are in place. Open a table QR code and place a test order with card 4242 4242 4242 4242.'
          : 'The menu and tables can be used now. Card payments stay off until Stripe finishes verifying the restaurant.'}
      </p>

      {/* Payment readiness status */}
      <div className="max-w-md mx-auto mb-8 text-left">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Payment status</span>
        </div>
        {paymentStatus === 'loading' && (
          <p className="text-sm text-gray-400">Checking your payment account…</p>
        )}
        {paymentStatus !== 'loading' && (
          <p className="text-sm text-gray-600 flex items-start gap-2">
            {paymentStatus === 'ready' ? (
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            )}
            <span>{paymentMessage || (paymentStatus === 'ready'
              ? 'Payments look good.'
              : 'We’ll guide you through finishing payment setup from Settings if needed.')}</span>
          </p>
        )}

        {paymentStatus === 'incomplete' && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFinishPaymentSetup}
              disabled={paymentActionLoading}
            >
              {paymentActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Opening Stripe…
                </>
              ) : (
                <>
                  Finish payment setup
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <Button onClick={handleGoToDashboard} size="lg" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving menu…
          </>
        ) : (
          <>
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}