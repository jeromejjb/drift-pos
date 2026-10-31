import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRestaurantByTableId, getMenuByRestaurantId, type Restaurant } from '../lib/api';
import type { Category } from '../types';

export function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!tableId) return;
      try {
        setLoading(true);
        const data = await getRestaurantByTableId(tableId);
        setRestaurant(data);
        localStorage.setItem('drift-restaurant', data.id);
        localStorage.setItem('drift-tax-rate', String(data.taxRate ?? 0));
        const cats = await getMenuByRestaurantId(data.id);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        setError('Could not find this table');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableId]);

  const currentTable = restaurant?.tables.find(t => t.id === tableId);
  const tableNumber = currentTable?.number ?? '?';
  const isWalkIn = currentTable?.number === 0;

  const goToMenu = (categoryId?: string) => {
    navigate(`/menu/${tableId}`, { state: categoryId ? { activeCategory: categoryId } : {} });
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
        <div className="bg-white rounded-2xl border border-[var(--drift-border)] p-8 text-center max-w-sm shadow-[var(--drift-shadow)]">
          <div className="w-16 h-16 bg-[var(--drift-error-bg)] rounded-[var(--drift-radius-xl)] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--drift-ink)] mb-2">Table not found</h2>
          <p className="text-[var(--drift-ink-muted)] text-sm mb-6">The QR code might be invalid or expired</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-[var(--drift-accent)] text-white font-semibold rounded-[var(--drift-radius-pill)] hover:bg-[var(--drift-accent-hover)] transition-colors"
          >
            Scan again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] pb-24">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-4 p-3 text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] active:bg-[var(--drift-surface-overlay)] rounded-full transition-colors z-10"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="container max-w-md mx-auto px-4 pt-14 pb-8">
        {/* Welcome — first 2 seconds matter */}
        <div className="mb-8 animate-fade-in">
          <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">Welcome to</p>
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-0.5">{restaurant.name}</h1>
          <p className="text-sm text-[var(--drift-ink-muted)] mt-2">
            {isWalkIn ? 'Walk-in · Counter' : `Table ${tableNumber}`}
          </p>
        </div>

        {/* Categories as tiles — research: main categories as clear buttons */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--drift-ink)] mb-3">Browse menu</p>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goToMenu(cat.id)}
                  className="flex items-center justify-between p-4 bg-white border border-[var(--drift-border)] rounded-[var(--drift-radius-xl)] hover:border-[var(--drift-accent)]/50 hover:bg-[var(--drift-accent-muted)]/30 transition-all text-left group"
                >
                  <span className="font-medium text-[var(--drift-ink)]">{cat.name}</span>
                  <ChevronRight className="w-5 h-5 text-[var(--drift-ink-muted)] group-hover:text-[var(--drift-accent)]" />
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => goToMenu()}
              className="w-full flex items-center justify-center gap-3 p-5 bg-[var(--drift-accent)] text-white rounded-[var(--drift-radius-xl)] hover:bg-[var(--drift-accent-hover)] transition-colors"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-semibold">View full menu</span>
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <button
            onClick={() => goToMenu()}
            className="w-full py-3.5 bg-[var(--drift-ink)] text-white font-semibold rounded-[var(--drift-radius-pill)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            View all categories
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[var(--drift-ink-subtle)] py-3 text-sm hover:text-[var(--drift-ink-muted)] transition-colors mt-4"
        >
          Not my table
        </button>

        <p className="text-center text-xs text-[var(--drift-ink-subtle)] mt-8">
          Order & pay at your table — no app download required
        </p>
      </div>
    </div>
  );
}