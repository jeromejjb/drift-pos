import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRestaurantByTableId, type Restaurant } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!tableId) return;
      try {
        setLoading(true);
        const data = await getRestaurantByTableId(tableId);
        setRestaurant(data);
      } catch (err) {
        setError('Could not find this table');
      } finally {
        setLoading(false);
      }
    };
    loadRestaurant();
  }, [tableId]);

  const currentTable = restaurant?.tables.find(t => t.id === tableId);
  const tableNumber = currentTable?.number || '?';

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => navigate(`/menu/${tableId}`), 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--drift-border)] border-t-[var(--drift-ink)] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[var(--drift-ink-muted)] text-sm">Finding your table…</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[var(--drift-error-bg)] rounded-[var(--drift-radius-xl)] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--drift-ink)] mb-2">Table not found</h2>
          <p className="text-[var(--drift-ink-muted)] text-sm mb-6">The QR code might be invalid</p>
          <Button onClick={() => navigate('/')} fullWidth>
            Scan again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)]">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-4 p-3 text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] active:bg-[var(--drift-surface-overlay)] rounded-full transition-colors z-10"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="container max-w-md mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift · dine</p>
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-1">{restaurant.name}</h1>
        </div>

        <div className="relative mb-8 animate-slide-up">
          <Card padding="xl" className="relative text-center">
            <p className="text-sm text-[var(--drift-ink-muted)] mb-2">You're at</p>
            <div className="relative">
              <span className="text-8xl font-semibold block leading-none text-[var(--drift-ink)]">
                {tableNumber}
              </span>
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-[var(--drift-accent)] rounded-full" />
            </div>
            <p className="text-[var(--drift-ink-muted)] mt-2">Table {tableNumber}</p>
          </Card>
        </div>

        <div className="space-y-3 animate-slide-up">
          <Button onClick={handleConfirm} fullWidth disabled={confirming}>
            {confirming ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Just a moment…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                That's me
                <Check className="w-4 h-4" />
              </span>
            )}
          </Button>
          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-[var(--drift-ink-muted)] py-3 text-sm hover:text-[var(--drift-ink)] transition-colors"
          >
            Not my table
          </button>
        </div>

        <p className="text-center text-xs text-[var(--drift-ink-subtle)] mt-8">
          Check out with Drift — secure payment
        </p>
      </div>
    </div>
  );
}