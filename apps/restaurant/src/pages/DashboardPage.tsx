import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { QuickOrderModal } from '../components/pos/QuickOrderModal';
import { playOrderNotificationSound } from '../lib/orderSound';
import { 
  Coffee, 
  ChevronRight,
  RefreshCw,
  Plus,
  ShoppingBag,
  Wallet,
  Timer,
  ChefHat
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import io from 'socket.io-client';

interface OrderSummary {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  revenue: number;
}

interface Order {
  id: string;
  tableNumber: number;
  items: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
}

// Fallback data with correct status types
const FALLBACK_SUMMARY: OrderSummary = {
  total: 12,
  pending: 3,
  preparing: 2,
  ready: 1,
  revenue: 456.50
};

const now = () => new Date().toISOString();
const minsAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

const FALLBACK_ORDERS: Order[] = [
  { id: '#1834', tableNumber: 3, items: '2x Margherita, 1x Caesar Salad', total: 42, status: 'pending', createdAt: minsAgo(2) },
  { id: '#1833', tableNumber: 7, items: '1x Grilled Salmon, 2x House Coffee', total: 52, status: 'preparing', createdAt: minsAgo(8) },
  { id: '#1832', tableNumber: 2, items: '3x Bruschetta, 1x Pasta Carbonara', total: 63, status: 'ready', createdAt: minsAgo(15) },
  { id: '#1831', tableNumber: 5, items: '1x Burger & Fries, 2x Fresh Lemonade', total: 26, status: 'pending', createdAt: minsAgo(4) },
  { id: '#1830', tableNumber: 1, items: '1x Tiramisu, 1x Craft Beer', total: 17, status: 'preparing', createdAt: minsAgo(12) },
];

export function DashboardPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OrderSummary>(FALLBACK_SUMMARY);
  const [recentOrders, setRecentOrders] = useState<Order[]>(FALLBACK_ORDERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Your Restaurant');
  const [apiAvailable, setApiAvailable] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('drift-token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const prevOrderCountRef = useRef(0);

  useEffect(() => {
    fetchDashboardData().then(({ ordersCount }) => {
      prevOrderCountRef.current = ordersCount;
    });
    fetchRestaurantDetails();
    
    try {
      const socket = io(API_URL);
      socket.emit('join-restaurant', restaurantId);
      
      socket.on('order-updated', async () => {
        const prev = prevOrderCountRef.current;
        const { ordersCount } = await fetchDashboardData();
        if (ordersCount > prev) {
          playOrderNotificationSound();
        }
        prevOrderCountRef.current = ordersCount;
      });
      
      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.log('Socket connection failed, using demo mode');
    }
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurantName(data.name);
        setApiAvailable(true);
      }
    } catch (error) {
      console.log('Using default restaurant name');
      setRestaurantName('Your Restaurant');
      setApiAvailable(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/restaurant/${restaurantId}/stats`, { headers: authHeaders }),
        fetch(`${API_URL}/api/restaurant/${restaurantId}/orders`, { headers: authHeaders })
      ]);
      
      if (!statsRes.ok || !ordersRes.ok) {
        throw new Error('API unavailable');
      }
      
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      
      setSummary(statsData);
      
      // Ensure the status matches the expected union type
      const formattedOrders: Order[] = ordersData.slice(0, 5).map((order: any) => ({
        id: `#${order.id.slice(-4)}`,
        tableNumber: order.tableNumber,
        items: order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', '),
        total: order.total,
        status: order.status as 'pending' | 'preparing' | 'ready' | 'served',
        createdAt: order.createdAt
      }));
      
      setRecentOrders(formattedOrders);
      setApiAvailable(true);
      return { statsData, ordersCount: ordersData.length };
    } catch (error) {
      console.log('Using fallback dashboard data');
      setSummary(FALLBACK_SUMMARY);
      setRecentOrders(FALLBACK_ORDERS);
      setApiAvailable(false);
      return { statsData: FALLBACK_SUMMARY, ordersCount: 0 };
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = [
    { 
      label: 'Today\'s Orders', 
      value: summary.total, 
      icon: ShoppingBag, 
      color: 'bg-blue-500',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: summary.total > 0 ? '+12%' : 'No orders yet'
    },
    { 
      label: 'Revenue', 
      value: `$${summary.revenue.toFixed(2)}`, 
      icon: Wallet, 
      color: 'bg-green-500',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: summary.revenue > 0 ? 'Today' : '—'
    },
    { 
      label: 'Pending', 
      value: summary.pending, 
      icon: Timer, 
      color: 'bg-yellow-500',
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: summary.pending > 0 ? 'Need attention' : 'All clear'
    },
    { 
      label: 'Preparing', 
      value: summary.preparing, 
      icon: ChefHat, 
      color: 'bg-purple-500',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'In kitchen'
    },
  ];

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {!apiAvailable && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          ⚡ Running in demo mode with sample data. API connection unavailable.
        </div>
      )}

      {/* Welcome header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light">{getGreeting()},</h2>
          <p className="text-gray-400">{restaurantName}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-3 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} padding="md" className="hover:border-gray-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.change && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-light mb-1">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Active Orders Summary */}
      <Card padding="lg" className="mb-6">
        <h3 className="font-medium mb-4">Active Orders</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Timer className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-light text-yellow-600 mb-1">{summary.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <ChefHat className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-light text-blue-600 mb-1">{summary.preparing}</p>
            <p className="text-xs text-gray-500">Preparing</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Coffee className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-light text-green-600 mb-1">{summary.ready}</p>
            <p className="text-xs text-gray-500">Ready</p>
          </div>
        </div>
      </Card>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Recent Orders</h3>
          <button 
            onClick={() => navigate(`/orders/${restaurantId}`)}
            className="text-sm text-gray-400 flex items-center gap-1 active:text-black transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 mb-2">No orders yet today</p>
              <p className="text-xs text-gray-300">Your first order will appear here</p>
            </Card>
          ) : (
            recentOrders.map((order) => (
              <Card key={order.id} padding="md" className="hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Table {order.tableNumber}</span>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">{order.id}</p>
                  </div>
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">{order.items}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button 
                    onClick={() => navigate(`/orders/${restaurantId}`)}
                    className="text-xs text-black font-medium flex items-center gap-1"
                  >
                    Update
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Quick Order FAB */}
      <div className="fixed bottom-20 right-4 z-10">
        <button
          onClick={() => setShowQuickOrder(true)}
          className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-gray-800"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Order Modal */}
      <QuickOrderModal
        isOpen={showQuickOrder}
        onClose={() => setShowQuickOrder(false)}
        restaurantId={restaurantId || ''}
        onOrderComplete={() => {
          fetchDashboardData();
        }}
      />
    </Layout>
  );
}