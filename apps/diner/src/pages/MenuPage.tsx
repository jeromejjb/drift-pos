import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isShared: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export function MenuPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
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
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get restaurant by table ID
        const tableResponse = await fetch(`https://drift-api-7vs7.onrender.com/api/table/${tableId}/restaurant`);
        
        if (!tableResponse.ok) {
          throw new Error('Failed to fetch restaurant');
        }
        
        const restaurantData = await tableResponse.json();
        setRestaurantName(restaurantData.name);
        setRestaurantId(restaurantData.id);

        // Mock menu data for now
        const mockCategories = [
          {
            id: 'cat1',
            name: 'Antipasti',
            items: [
              { id: 'item1', name: 'Arancini', description: 'Crispy rice balls with mozzarella', price: 12, isShared: true, categoryId: 'cat1' },
              { id: 'item2', name: 'Calamari', description: 'Fried squid with marinara', price: 14, isShared: true, categoryId: 'cat1' },
              { id: 'item3', name: 'Burrata', description: 'Creamy burrata with heirloom tomatoes', price: 16, isShared: true, categoryId: 'cat1' },
            ]
          },
          {
            id: 'cat2',
            name: 'Pizza',
            items: [
              { id: 'item4', name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 18, isShared: true, categoryId: 'cat2' },
              { id: 'item5', name: 'Diavola', description: 'Spicy salami, tomato, mozzarella', price: 20, isShared: true, categoryId: 'cat2' },
              { id: 'item6', name: 'Quattro Formaggi', description: 'Four cheese blend', price: 22, isShared: true, categoryId: 'cat2' },
            ]
          }
        ];

        setCategories(mockCategories);
        if (mockCategories.length > 0) {
          setActiveCategory(mockCategories[0].id);
        }

        // Load saved cart from localStorage
        const savedCart = localStorage.getItem('drift-cart');
        if (savedCart) {
          const cartArray = JSON.parse(savedCart);
          const cartMap = new Map();
          cartArray.forEach((item: any) => {
            cartMap.set(item.id, item.quantity);
          });
          setCartItems(cartMap);
        }

      } catch (error) {
        console.error('Failed to load menu:', error);
        setError('Could not load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchMenu();
    }
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
      
      // Save to localStorage
      const cartArray = Array.from(newMap.entries()).map(([id, qty]) => {
        const item = categories.flatMap(c => c.items).find(i => i.id === id);
        return {
          id,
          quantity: qty,
          price: item?.price,
          name: item?.name
        };
      });
      localStorage.setItem('drift-cart', JSON.stringify(cartArray));
      localStorage.setItem('drift-restaurant', restaurantId);
      
      return newMap;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h2 className="text-xl font-medium mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} fullWidth>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 z-20">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <p className="text-xs text-gray-400">drift · {restaurantName}</p>
            <h2 className="text-xl font-light">Menu</h2>
          </div>
          
          <button 
            onClick={() => navigate(`/cart/${tableId}`)}
            className="relative p-3 active:bg-gray-50 rounded-full transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center animate-pop">
                  {cartCount}
                </span>
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[72px] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 z-10">
        <div className="flex gap-2 overflow-x-auto py-3 max-w-md mx-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                activeCategory === cat.id 
                  ? 'bg-black text-white shadow-md scale-105' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {categories.map(category => (
          <div 
            key={category.id} 
            className={activeCategory === category.id ? 'block animate-fade-in' : 'hidden'}
          >
            <div className="space-y-3">
              {category.items.map(item => {
                const quantity = cartItems.get(item.id) || 0;
                
                return (
                  <Card key={item.id} padding="md" className="hover:border-gray-200 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0"></div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-base">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {item.isShared && (
                            <Badge variant="pending" className="flex-shrink-0">share</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-medium text-base">${item.price}</span>
                          
                          {quantity === 0 ? (
                            <button
                              onClick={() => updateCart(item.id, 1)}
                              className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all shadow-md"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
                              <button
                                onClick={() => updateCart(item.id, -1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow active:scale-95 transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-medium">{quantity}</span>
                              <button
                                onClick={() => updateCart(item.id, 1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow active:scale-95 transition-all"
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

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8 animate-slide-up">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate(`/cart/${tableId}`)}
              className="w-full bg-black text-white py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-medium">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-light">${cartTotal.toFixed(2)}</span>
                <span className="text-white/60 text-sm">→</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}