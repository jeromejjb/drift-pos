import { useState, useEffect } from 'react';
import { X, Plus, Minus, Search, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  onOrderComplete?: () => void;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface Table {
  id: string;
  number: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';

export function QuickOrderModal({ isOpen, onClose, restaurantId, onOrderComplete }: QuickOrderModalProps) {
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      fetchTables();
    }
  }, [isOpen, restaurantId]);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurant/${restaurantId}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(Array.isArray(data) ? data : []);
      }
    } catch {
      setTables([]);
    }
  };

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`);
      if (response.ok) {
        const data = await response.json();
        // Flatten categories into items list
        const allItems = data.flatMap(cat => cat.items.map(item => ({
          ...item,
          category: cat.name
        })));
        setMenu(allItems);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (itemId: string) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = menu.find(i => i.id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menu.find(i => i.id === itemId);
        return {
          menuItemId: itemId,
          quantity,
          price: item?.price ?? 0
        };
      });

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId: selectedTableId || null,
          userId: 'staff-order',
          items,
          total: calculateTotal(),
          tip: 0
        })
      });

      if (response.ok) {
        setCart({});
        onOrderComplete?.();
        onClose();
      }
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-light">Quick Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Menu Section */}
          <div className="flex-1 p-4 overflow-y-auto border-r border-gray-100">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400 mb-1">{item.category}</p>
                    <p className="text-sm font-medium">${item.price}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="w-full md:w-80 p-4 flex flex-col">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Current Order
            </h3>

            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">Table</label>
              <select
                value={selectedTableId ?? ''}
                onChange={(e) => setSelectedTableId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
              >
                <option value="">Walk-in</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.number}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {Object.entries(cart).length === 0 ? (
                <p className="text-center text-gray-400 py-8">Cart is empty</p>
              ) : (
                Object.entries(cart).map(([itemId, qty]) => {
                  const item = menu.find(i => i.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <div key={itemId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">${item.price} × {qty}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeFromCart(itemId)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <button
                          onClick={() => addToCart(itemId)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {Object.keys(cart).length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex justify-between mb-4">
                  <span>Total</span>
                  <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                </div>
                <Button
                  onClick={placeOrder}
                  disabled={placing}
                  fullWidth
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}