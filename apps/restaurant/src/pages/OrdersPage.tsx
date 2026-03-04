import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import {
  CheckCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Timer,
  ChefHat,
  UtensilsCrossed,
  Receipt,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { playOrderNotificationSound } from '../lib/orderSound';
import io from 'socket.io-client';

interface Order {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  total: number;
  createdAt: string;
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

const FALLBACK_ORDERS: Order[] = [
  { id: 'fall-1', tableNumber: 3, items: [{ name: 'Margherita', quantity: 2, price: 14 }, { name: 'Caesar Salad', quantity: 1, price: 12 }], total: 40, status: 'pending', createdAt: minsAgo(2) },
  { id: 'fall-2', tableNumber: 7, items: [{ name: 'Grilled Salmon', quantity: 1, price: 24 }, { name: 'House Coffee', quantity: 2, price: 4 }], total: 32, status: 'preparing', createdAt: minsAgo(8) },
  { id: 'fall-3', tableNumber: 2, items: [{ name: 'Bruschetta', quantity: 3, price: 9 }, { name: 'Pasta Carbonara', quantity: 1, price: 18 }], total: 45, status: 'ready', createdAt: minsAgo(15) },
  { id: 'fall-4', tableNumber: 0, items: [{ name: 'Burger & Fries', quantity: 1, price: 16 }, { name: 'Fresh Lemonade', quantity: 2, price: 5 }], total: 26, status: 'pending', createdAt: minsAgo(4) },
  { id: 'fall-5', tableNumber: 5, items: [{ name: 'Tiramisu', quantity: 1, price: 10 }, { name: 'Craft Beer', quantity: 1, price: 7 }], total: 17, status: 'served', createdAt: minsAgo(45) },
];

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getTableLabel(tableNumber: number): string {
  return tableNumber === 0 ? 'Walk-in' : `Table ${tableNumber}`;
}

export function OrdersPage() {
  const { restaurantId } = useParams();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const prevOrderCountRef = useRef(0);

  const fetchOrders = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/orders`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      const normalized = data.map((o: any) => ({
        id: o.id,
        tableNumber: o.tableNumber,
        items: o.items || [],
        status: (o.status || 'pending').toLowerCase(),
        total: o.total ?? 0,
        createdAt: o.createdAt,
      }));
      setOrders(normalized);
      return normalized;
    } catch (err) {
      setError('Unable to load orders. Showing sample data.');
      setOrders(FALLBACK_ORDERS);
      return FALLBACK_ORDERS;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders().then((data) => {
      prevOrderCountRef.current = data?.length ?? 0;
    });

    const socket = io(API_URL);
    socket.emit('join-restaurant', restaurantId);

    socket.on('order-updated', async () => {
      const newOrders = await fetchOrders();
      if (Array.isArray(newOrders) && newOrders.length > prevOrderCountRef.current) {
        playOrderNotificationSound();
        prevOrderCountRef.current = newOrders.length;
      }
    });

    return () => socket.disconnect();
  }, [restaurantId]);

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingId(orderId);
    // Mock orders: update local state only
    if (orderId.startsWith('fall-')) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setUpdatingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      setError('Could not update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return !['served', 'completed', 'cancelled'].includes(order.status);
    if (filter === 'completed') return ['served', 'completed'].includes(order.status);
    if (search) {
      const q = search.toLowerCase();
      return (
        order.tableNumber.toString().includes(search) ||
        order.id.toLowerCase().includes(q) ||
        getTableLabel(order.tableNumber).toLowerCase().includes(q) ||
        order.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const summary = {
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    total: orders.reduce((s, o) => s + o.total, 0),
  };

  const statusConfig = {
    pending: { icon: Timer, label: 'Pending', color: 'bg-amber-50 text-amber-700', iconColor: 'text-amber-600' },
    preparing: { icon: ChefHat, label: 'Preparing', color: 'bg-blue-50 text-blue-700', iconColor: 'text-blue-600' },
    ready: { icon: UtensilsCrossed, label: 'Ready', color: 'bg-emerald-50 text-emerald-700', iconColor: 'text-emerald-600' },
    served: { icon: CheckCircle, label: 'Served', color: 'bg-gray-100 text-gray-600', iconColor: 'text-gray-500' },
    completed: { icon: CheckCircle, label: 'Completed', color: 'bg-gray-100 text-gray-600', iconColor: 'text-gray-500' },
    cancelled: { icon: AlertCircle, label: 'Cancelled', color: 'bg-red-50 text-red-600', iconColor: 'text-red-500' },
  };

  if (loading) {
    return (
      <Layout title="Orders">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Orders">
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Timer className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-light text-amber-700">{summary.pending}</p>
            <p className="text-xs text-amber-600/80">Pending</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-light text-blue-700">{summary.preparing}</p>
            <p className="text-xs text-blue-600/80">Preparing</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-light text-emerald-700">{summary.ready}</p>
            <p className="text-xs text-emerald-600/80">Ready</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-light text-gray-700">${summary.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['active', 'all', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-black text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by table, order ID, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
          />
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card padding="xl" className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {filter === 'active' ? 'No active orders' : filter === 'completed' ? 'No completed orders' : 'No orders found'}
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              {filter === 'active'
                ? 'New orders will appear here as they come in. Try the Quick Order button to add one.'
                : search
                  ? 'Try a different search or filter.'
                  : 'Orders you mark as served will show up here.'}
            </p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status] ?? statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <Card key={order.id} padding="lg" className="hover:border-gray-200 transition-all">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900">
                        {getTableLabel(order.tableNumber)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(order.createdAt)} · #{order.id.slice(-6)}
                    </p>
                  </div>
                  <span className="text-xl font-semibold text-gray-900 shrink-0">
                    ${order.total.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="text-gray-500">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {!['served', 'completed', 'cancelled'].includes(order.status) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Update status
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                      disabled={updatingId === order.id}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                    </select>
                    {updatingId === order.id && (
                      <p className="text-xs text-gray-400 mt-1">Updating...</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </Layout>
  );
}
