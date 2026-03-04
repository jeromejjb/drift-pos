import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_URL, STRIPE_PUBLISHABLE_KEY } from '../lib/api';
import { toPaymentError } from '../lib/userErrors';
import { InlineError } from '../components/ui/InlineError';

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

export function PaymentPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { accessToken, refreshSession } = useAuth();
  const isGuest = !accessToken;
  const [dinerProfile, setDinerProfile] = useState<{ id: string; stripeCustomerId?: string } | null>(null);
  const [loyalty, setLoyalty] = useState<{ points: number; tier: string } | null>(null);
  const [tipPercent, setTipPercent] = useState(18);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [piLoading, setPiLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('drift-cart');
    const savedRestaurant = localStorage.getItem('drift-restaurant');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (_) {}
    }
    if (savedRestaurant) setRestaurantId(savedRestaurant);
    setLoading(false);
  }, [tableId]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchMe = async (token: string) => {
      const r = await fetch(`${API_URL}/api/diner/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data?.id) setDinerProfile({ id: data.id, stripeCustomerId: data.stripeCustomerId });
      return { status: r.status, data };
    };
    fetchMe(accessToken).then(async (result) => {
      if (result.status === 401 && result.data?.code === 'INVALID_TOKEN') {
        const newToken = await refreshSession();
        if (newToken) fetchMe(newToken);
      }
    }).catch(() => {});
  }, [accessToken, refreshSession]);

  useEffect(() => {
    if (!accessToken || !restaurantId) return;
    fetch(`${API_URL}/api/diner/loyalty?restaurantId=${restaurantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLoyalty({ points: data.points, tier: data.tier }))
      .catch(() => {});
  }, [accessToken, restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-border)] border-t-[var(--drift-ink)]" />
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const tip = (subtotal * tipPercent) / 100;
  const total = subtotal + tax + tip;

  const createOrderAndGetPaymentIntent = useCallback(async () => {
    setError(null);
    setClientSecret(null);
    if (!tableId || !restaurantId || !cartItems.length) {
      setError('Missing table, restaurant, or cart. Please go back to the menu.');
      return;
    }
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Card payment isn’t available right now. Please pay at the table or try again later.');
      return;
    }
    setPiLoading(true);
    try {
      const userId = dinerProfile?.id ?? 'guest-' + Math.random().toString(36).slice(2, 11);
      const orderRes = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({
          restaurantId,
          tableId,
          userId,
          items: cartItems.map((item: any) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
          tip,
        }),
      });
      const orderText = await orderRes.text();
      if (!orderRes.ok) {
        const errData = orderText ? (() => { try { return JSON.parse(orderText); } catch { return {}; } })() : {};
        setError(toPaymentError(errData.error || orderText, orderRes.status));
        return;
      }
      const order = JSON.parse(orderText);
      setOrderId(order.id);

      const payRes = await fetch(
        `${API_URL}/api/stripe/order/${order.id}/create-payment-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dinerProfile?.stripeCustomerId ? { customerId: dinerProfile.stripeCustomerId } : {}),
        }
      );
      const payJson = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        if (payJson.code === 'RESTAURANT_NO_STRIPE') {
          setError("This restaurant isn't set up for card payments yet. Please pay at the table.");
        } else {
          setError(toPaymentError(payJson.error, payRes.status));
        }
        return;
      }
      if (payJson.clientSecret) {
        setClientSecret(payJson.clientSecret);
        localStorage.setItem('drift-pending-order', order.id);
      } else {
        setError(toPaymentError('Invalid payment response'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(toPaymentError(msg));
    } finally {
      setPiLoading(false);
    }
  }, [tableId, restaurantId, cartItems, total, tip, dinerProfile?.id, dinerProfile?.stripeCustomerId, accessToken]);

  // Effortless: create order + PI as soon as we have cart and tip
  useEffect(() => {
    if (loading || !cartItems.length || !restaurantId || !tableId) return;
    createOrderAndGetPaymentIntent();
  }, [loading, cartItems.length, restaurantId, tableId, tipPercent, createOrderAndGetPaymentIntent]);

  const handlePaymentSuccess = () => {
    localStorage.removeItem('drift-cart');
    localStorage.removeItem('drift-restaurant');
    const id = orderId || localStorage.getItem('drift-pending-order');
    localStorage.removeItem('drift-pending-order');
    if (id) navigate(`/confirmation/${id}`);
  };

  if (!cartItems.length || !restaurantId || !tableId) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex flex-col items-center justify-center p-4 relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 text-[var(--drift-ink)] hover:bg-[var(--drift-surface-overlay)] rounded-[var(--drift-radius)]">← Back</button>
        <p className="text-[var(--drift-ink-muted)] text-center">Your cart is empty. Go back to the menu to add items.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)]">
      <div className="sticky top-0 bg-[var(--drift-surface-elevated)]/95 backdrop-blur-md border-b border-[var(--drift-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-[var(--drift-radius)] text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] hover:bg-[var(--drift-surface-overlay)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift · dine</p>
            <h2 className="text-lg font-semibold text-[var(--drift-ink)]">Pay</h2>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto pb-24 safe-bottom">
        <div className="bg-[var(--drift-surface)] border border-[var(--drift-border)] rounded-[var(--drift-radius-xl)] p-5 mb-5 shadow-[var(--drift-shadow-sm)]">
          <h3 className="font-semibold text-[var(--drift-ink)] mb-3">Order</h3>
          <div className="space-y-2.5 text-[15px] text-[var(--drift-ink-muted)]">
            {cartItems.map((item: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-[var(--drift-ink)]">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-[var(--drift-border)] mt-3 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--drift-ink)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-[var(--drift-ink)]">${tax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="font-semibold text-[var(--drift-ink)] mb-3">Tip</h3>
          <div className="flex gap-2">
            {[15, 18, 20, 25].map((percent) => (
              <button
                key={percent}
                onClick={() => setTipPercent(percent)}
                disabled={piLoading}
                className={`flex-1 py-3 rounded-[var(--drift-radius-pill)] border transition-all disabled:opacity-60 ${
                  tipPercent === percent
                    ? 'bg-[var(--drift-accent)] text-white border-[var(--drift-accent)] shadow-[var(--drift-shadow-sm)]'
                    : 'border-[var(--drift-border)] text-[var(--drift-ink)] hover:border-[var(--drift-accent)]/50 hover:bg-[var(--drift-accent-muted)]'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--drift-accent)] text-white rounded-[var(--drift-radius-xl)] p-5 mb-5 shadow-[0_4px_16px_var(--drift-accent-glow)]">
          <div className="flex justify-between items-center">
            <span className="text-white/90 font-medium">Total</span>
            <span className="text-3xl font-bold tabular-nums">${total.toFixed(2)}</span>
          </div>
        </div>

        {isGuest ? (
          <div className="mb-4 p-4 bg-[var(--drift-accent-muted)] border border-[var(--drift-accent)]/20 rounded-[var(--drift-radius-xl)] flex items-center gap-3">
            <Gift className="w-5 h-5 text-[var(--drift-accent)] shrink-0" />
            <div>
              <p className="font-medium text-[var(--drift-ink)] text-sm">Earn points on this order</p>
              <p className="text-xs text-[var(--drift-ink-muted)]">Sign in to save points and get rewards</p>
            </div>
            <button
              onClick={() => navigate(`/signin?return=${encodeURIComponent(window.location.pathname)}`)}
              className="ml-auto text-sm font-semibold text-[var(--drift-accent)] hover:underline shrink-0"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-[var(--drift-accent-muted)] border border-[var(--drift-accent)]/20 rounded-[var(--drift-radius-xl)] flex items-center gap-3">
            <Gift className="w-5 h-5 text-[var(--drift-accent)] shrink-0" />
            <div>
              <p className="font-medium text-[var(--drift-ink)] text-sm">
                Earn ~{Math.floor(total)} pts on this order
              </p>
              <p className="text-xs text-[var(--drift-ink-muted)]">
                {loyalty ? `${loyalty.points} pts total · ${loyalty.tier}` : '1 pt per $1 · Points save automatically'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <InlineError message={error} onRetry={() => { setError(null); createOrderAndGetPaymentIntent(); }} />
          </div>
        )}

        {piLoading && !clientSecret ? (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-border)] border-t-[var(--drift-accent)]" />
            <p className="text-[15px] text-[var(--drift-ink-muted)]">Preparing payment…</p>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
            <CheckoutForm onSuccess={handlePaymentSuccess} amount={total} />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutForm({ onSuccess, amount }: { onSuccess: () => void; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment/return',
        payment_method_data: {
          billing_details: {},
        },
      },
    });
    setProcessing(false);
    if (confirmError) {
      setError(toPaymentError(confirmError.message));
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: { type: 'accordion', radios: 'never', spacedAccordionItems: false } }} />
      {error && <InlineError message={error} />}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full min-h-[48px] bg-[var(--drift-accent)] hover:bg-[var(--drift-accent-hover)] disabled:opacity-50 text-white font-semibold text-[15px] py-4 px-6 rounded-[var(--drift-radius-pill)] transition-all duration-[var(--drift-duration)] shadow-[var(--drift-shadow-sm)]"
      >
        {processing ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
