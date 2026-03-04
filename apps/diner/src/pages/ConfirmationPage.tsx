import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CheckCircle, QrCode, Gift } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface OrderSummary {
  id: string;
  total: number;
  tipAmount: number;
  restaurantName: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
}

export function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/order/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setOrder(data);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-border)] border-t-[var(--drift-accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex flex-col items-center justify-center px-5 py-8">
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-[var(--drift-accent-muted)] flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[var(--drift-accent)]" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--drift-ink)] mb-2">Order confirmed</h1>
        <p className="text-[var(--drift-ink-muted)] text-sm mb-6">
          Your order has been sent to the kitchen.
        </p>

        {order && (
          <div className="bg-[var(--drift-surface)] border border-[var(--drift-border)] rounded-[var(--drift-radius-xl)] p-5 mb-6 text-left shadow-[var(--drift-shadow-sm)]">
            <p className="text-xs uppercase tracking-wider text-[var(--drift-ink-subtle)] mb-2">
              {order.restaurantName} · {order.tableNumber === 0 ? 'Walk-in' : `Table ${order.tableNumber}`}
            </p>
            <div className="space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[var(--drift-ink-muted)]">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-[var(--drift-ink)]">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--drift-border)] mt-3 pt-3 flex justify-between font-semibold text-[var(--drift-ink)]">
              <span>Total</span>
              <span>${(order.total + (order.tipAmount ?? 0)).toFixed(2)}</span>
            </div>
          </div>
        )}

        {accessToken && order && (
          <div className="bg-[var(--drift-accent-muted)] border border-[var(--drift-accent)]/20 rounded-[var(--drift-radius-xl)] p-4 mb-4 flex items-center gap-3">
            <Gift className="w-8 h-8 text-[var(--drift-accent)] shrink-0" />
            <div>
              <p className="font-medium text-[var(--drift-ink)]">You earned ~{Math.floor(order.total + (order.tipAmount ?? 0))} points!</p>
              <p className="text-xs text-[var(--drift-ink-muted)]">Points are added to your account automatically</p>
            </div>
          </div>
        )}

        <div className="bg-[var(--drift-accent-muted)]/50 border border-[var(--drift-accent)]/20 rounded-[var(--drift-radius-xl)] p-4 mb-8 text-left">
          <p className="text-sm text-[var(--drift-ink-muted)] mb-1">Estimated wait</p>
          <p className="text-xl font-semibold text-[var(--drift-ink)]">15–20 min</p>
        </div>

        <Button fullWidth onClick={() => navigate('/')} icon={<QrCode className="w-4 h-4" />}>
          Back to Dine
        </Button>
        {!accessToken && (
          <p className="mt-6 text-sm text-[var(--drift-ink-subtle)]">
            <button
              type="button"
              onClick={() => navigate('/signin?return=/pay')}
              className="underline hover:text-[var(--drift-ink-muted)] transition-colors"
            >
              Sign in to earn points on your next order
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
