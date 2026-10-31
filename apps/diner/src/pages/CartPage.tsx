import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { CartItem } from '../lib/api';

export function CartPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('drift-cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCart([]);
      }
    }
    setLoading(false);
  }, [tableId]);

  useEffect(() => {
    if (!loading) localStorage.setItem('drift-cart', JSON.stringify(cart));
  }, [cart, loading]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-border)] border-t-[var(--drift-ink)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)]">
      <div className="sticky top-0 bg-[var(--drift-surface-elevated)]/95 backdrop-blur border-b border-[var(--drift-border)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/menu/${tableId}`)}
            className="p-2 -ml-2 rounded-[var(--drift-radius)] text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] hover:bg-[var(--drift-surface-overlay)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift · dine</p>
            <h2 className="text-lg font-semibold text-[var(--drift-ink)]">Your cart</h2>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto pb-40">
        {cart.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fade-in">
            <div className="w-20 h-20 bg-[var(--drift-accent-muted)] rounded-[var(--drift-radius-2xl)] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-[var(--drift-accent)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--drift-ink)] mb-2">Your cart is empty</h3>
            <p className="text-[var(--drift-ink-muted)] text-sm mb-6 max-w-xs mx-auto">
              Add something delicious from the menu to get started
            </p>
            <button
              onClick={() => navigate(`/menu/${tableId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--drift-accent)] text-white font-semibold rounded-[var(--drift-radius-pill)] hover:bg-[var(--drift-accent-hover)] transition-colors"
            >
              Browse menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between py-4 border-b border-[var(--drift-border)] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--drift-ink)]">{item.name}</h3>
                    {item.isShared && (
                      <span className="text-xs bg-[var(--drift-surface-overlay)] px-2 py-0.5 rounded-full text-[var(--drift-ink-muted)]">
                        share
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--drift-ink-muted)] mt-1">${item.price} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 rounded-[var(--drift-radius)] hover:bg-[var(--drift-surface-overlay)] text-[var(--drift-ink-muted)]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-[var(--drift-ink)] font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-2 rounded-[var(--drift-radius)] hover:bg-[var(--drift-surface-overlay)] text-[var(--drift-ink-muted)]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-[var(--drift-ink-subtle)] hover:text-[var(--drift-error-text)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 bg-[var(--drift-surface)] border-t border-[var(--drift-border)] p-4">
          <div className="container max-w-md mx-auto">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-[var(--drift-ink-muted)]">
                <span>Subtotal</span>
                <span className="text-[var(--drift-ink)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--drift-ink-muted)]">
                <span>Tax</span>
                <span className="text-[var(--drift-ink)]">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-[var(--drift-border)] text-[var(--drift-ink)]">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/payment/${tableId}`)}
              className="w-full bg-[var(--drift-accent)] hover:bg-[var(--drift-accent-hover)] text-white font-semibold py-3.5 px-6 rounded-[var(--drift-radius-pill)] transition-all shadow-[var(--drift-shadow-sm)] active:scale-[0.99]"
            >
              Check out — ${total.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}