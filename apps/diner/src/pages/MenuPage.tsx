import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, UtensilsCrossed } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRestaurantByTableId, getMenuByRestaurantId, type Category } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function MenuPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateCategory = (location.state as { activeCategory?: string })?.activeCategory;
  const [cartItems, setCartItems] = useState<Map<string, number>>(new Map());
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartCount = Array.from(cartItems.values()).reduce((a, b) => a + b, 0);
  const cartTotal = Array.from(cartItems.entries()).reduce((total, [itemId, qty]) => {
    const item = categories.flatMap(c => c.items).find(i => i.id === itemId);
    return total + (item?.price || 0) * qty;
  }, 0);

  useEffect(() => {
    if (!tableId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const restaurant = await getRestaurantByTableId(tableId);
        if (cancelled) return;
        setRestaurantName(restaurant.name);
        setRestaurantId(restaurant.id);

        const categoriesList = await getMenuByRestaurantId(restaurant.id);
        if (cancelled) return;
        setCategories(Array.isArray(categoriesList) ? categoriesList : []);
        if (categoriesList.length > 0) {
          const initial = stateCategory && categoriesList.some((c: Category) => c.id === stateCategory)
            ? stateCategory
            : categoriesList[0].id;
          setActiveCategory(initial);
        }

        const savedCart = localStorage.getItem('drift-cart');
        if (savedCart) {
          const cartArray = JSON.parse(savedCart);
          const cartMap = new Map<string, number>();
          cartArray.forEach((item: { id: string; quantity: number }) => {
            cartMap.set(item.id, item.quantity);
          });
          setCartItems(cartMap);
        }
      } catch {
        if (!cancelled) setError('Could not load menu. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tableId]);

  const updateCart = (itemId: string, delta: number) => {
    setCartItems(prev => {
      const newMap = new Map(prev);
      const current = prev.get(itemId) || 0;
      const next = current + delta;
      
      if (next <= 0) {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, next);
      }
      
      const cartArray = Array.from(newMap.entries()).map(([id, qty]) => {
        const item = categories.flatMap(c => c.items).find(i => i.id === id);
        return {
          id,
          quantity: qty,
          price: item?.price ?? 0,
          name: item?.name ?? '',
          isShared: item?.isShared ?? false,
        };
      });
      localStorage.setItem('drift-cart', JSON.stringify(cartArray));
      localStorage.setItem('drift-restaurant', restaurantId);
      
      return newMap;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--drift-border)] border-t-[var(--drift-ink)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[var(--drift-error-bg)] rounded-[var(--drift-radius-xl)] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--drift-ink)] mb-2">Something went wrong</h2>
          <p className="text-[var(--drift-ink-muted)] text-sm mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} fullWidth>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const hasItems = categories.some((c) => c.items?.length > 0);

  if (categories.length === 0 || !hasItems) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[var(--drift-accent-muted)] rounded-[var(--drift-radius-2xl)] flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-10 h-10 text-[var(--drift-accent)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--drift-ink)] mb-2">Menu coming soon</h2>
          <p className="text-[var(--drift-ink-muted)] text-sm mb-6">
            {restaurantName} is still setting up their menu. Check back later!
          </p>
          <Button onClick={() => navigate('/')} fullWidth variant="secondary">
            Back to scan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] pb-36">
      <div className="sticky top-0 bg-[var(--drift-surface-elevated)]/95 backdrop-blur border-b border-[var(--drift-border)] px-4 py-3 z-20">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift · dine</p>
            <h2 className="text-lg font-semibold text-[var(--drift-ink)]">{restaurantName}</h2>
          </div>
          <button
            onClick={() => navigate(`/cart/${tableId}`)}
            className="relative p-3 rounded-[var(--drift-radius)] hover:bg-[var(--drift-surface-overlay)] transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-[var(--drift-ink)]" />
            {cartCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--drift-ink)] text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[var(--drift-accent)] rounded-full" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="sticky top-[72px] bg-[var(--drift-surface-elevated)]/95 backdrop-blur border-b border-[var(--drift-border)] px-4 z-10">
        <div className="flex gap-2 overflow-x-auto py-3 max-w-md mx-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[var(--drift-ink)] text-white'
                  : 'bg-[var(--drift-surface-overlay)] text-[var(--drift-ink-muted)] hover:bg-[var(--drift-border)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {categories.map((category) => (
          <div
            key={category.id}
            className={activeCategory === category.id ? 'block animate-fade-in' : 'hidden'}
          >
            <div className="space-y-3">
              {category.items.map((item) => {
                const quantity = cartItems.get(item.id) || 0;
                return (
                  <Card key={item.id} padding="md" className="hover:border-[var(--drift-border-strong)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-[var(--drift-accent-muted)] rounded-[var(--drift-radius)] flex-shrink-0 flex items-center justify-center">
                        <UtensilsCrossed className="w-7 h-7 text-[var(--drift-accent)]/60" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-[var(--drift-ink)]">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-[var(--drift-ink-muted)] line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {item.isShared && (
                            <Badge variant="pending" className="flex-shrink-0">share</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-medium text-[var(--drift-ink)]">${item.price}</span>
                          {quantity === 0 ? (
                            <button
                              onClick={() => updateCart(item.id, 1)}
                              className="w-10 h-10 bg-[var(--drift-ink)] text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-[var(--drift-surface-overlay)] rounded-full px-1 py-0.5">
                              <button
                                onClick={() => updateCart(item.id, -1)}
                                className="w-8 h-8 bg-[var(--drift-surface)] rounded-full flex items-center justify-center hover:bg-[var(--drift-border)] transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-medium text-[var(--drift-ink)]">{quantity}</span>
                              <button
                                onClick={() => updateCart(item.id, 1)}
                                className="w-8 h-8 bg-[var(--drift-surface)] rounded-full flex items-center justify-center hover:bg-[var(--drift-border)] transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--drift-surface-elevated)] via-[var(--drift-surface-elevated)]/95 to-transparent pt-8 safe-bottom">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate(`/cart/${tableId}`)}
              className="w-full bg-[var(--drift-ink)] text-white py-4 px-6 rounded-[var(--drift-radius-xl)] flex items-center justify-between hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-medium">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </div>
              <span className="text-lg font-medium">${cartTotal.toFixed(2)} →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}