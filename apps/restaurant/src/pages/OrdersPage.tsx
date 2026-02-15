// apps/restaurant/src/pages/OrdersPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Clock, 
  Coffee, 
  CheckCircle, 
  Search,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import io from 'socket.io-client';

interface Order {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  total: number;
  createdAt: string;
}

export function OrdersPage() {
  const { restaurantId } = useParams();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api.onrender.com';

  useEffect(() => {
    fetchOrders();
    
    const socket = io(API_URL);
    socket.emit('join-restaurant', restaurantId);
    
    socket.on('order-updated', () => {
      fetchOrders();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await fetch(`${API_URL}/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return !['served'].includes(order.status);
    if (filter === 'completed') return ['served'].includes(order.status);
    if (search) {
      return order.tableNumber.toString().includes(search) || 
             order.id.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    served: 'bg-gray-100 text-gray-700',
  };

  const statusIcons = {
    pending: Clock,
    preparing: Coffee,
    ready: CheckCircle,
    served: CheckCircle,
  };

  if (loading) {
    return (
      <Layout title="Orders">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Orders">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(['active', 'all', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === f 
                ? 'bg-black text-white shadow-md' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status];
          
          return (
            <Card key={order.id} padding="md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Table {order.tableNumber}</span>
                    <Badge variant={order.status}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="font-medium">${order.total}</span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-400">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.status !== 'served' && (
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              )}
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}