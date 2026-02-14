import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Clock, 
  Coffee, 
  Users, 
  DollarSign,
  ChevronRight,
  RefreshCw
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

export function DashboardPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OrderSummary>({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

useEffect(() => {
  fetchDashboardData();
  
  const socket = io('http://localhost:3001');
  socket.emit('join-restaurant', restaurantId);
  
  socket.on('order-updated', () => {
    fetchDashboardData();
  });
  
  return () => {
    socket.disconnect();
  };
}, [restaurantId]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`http://localhost:3001/api/restaurant/${restaurantId}/stats`),
        fetch(`http://localhost:3001/api/restaurant/${restaurantId}/orders`)
      ]);
      
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      
      setSummary(statsData);
      
      const formattedOrders = ordersData.slice(0, 3).map((order: any) => ({
        id: `#${order.id.slice(-4)}`,
        tableNumber: order.tableNumber,
        items: order.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', '),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }));
      
      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = [
    { 
      label: 'Today\'s Orders', 
      value: summary.total, 
      icon: Users, 
      color: 'bg-blue-500',
      change: summary.total > 0 ? '+12%' : 'No orders yet'
    },
    { 
      label: 'Revenue', 
      value: `$${summary.revenue.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-green-500',
      change: summary.revenue > 0 ? 'Today' : '—'
    },
    { 
      label: 'Pending', 
      value: summary.pending, 
      icon: Clock, 
      color: 'bg-yellow-500',
      change: summary.pending > 0 ? 'Need attention' : 'All clear'
    },
    { 
      label: 'Preparing', 
      value: summary.preparing, 
      icon: Coffee, 
      color: 'bg-purple-500',
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
      {/* Welcome header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light">Good evening,</h2>
          <p className="text-gray-400">Trattoria Bellini</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-3 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid - 2 columns on phone, 4 on tablet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} padding="md" className="hover:border-gray-200 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
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
        ))}
      </div>

      {/* Active Orders Summary - Tablet/Phone friendly */}
      <Card padding="lg" className="mb-6">
        <h3 className="font-medium mb-4">Active Orders</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <p className="text-2xl font-light text-yellow-600 mb-1">{summary.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-2xl font-light text-blue-600 mb-1">{summary.preparing}</p>
            <p className="text-xs text-gray-500">Preparing</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
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
                      <Badge variant={order.status as any}>{order.status}</Badge>
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

      {/* Quick actions for tablet/phone */}
      <div className="fixed bottom-20 right-4 z-10">
        <button className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <span className="text-2xl">+</span>
        </button>
      </div>
    </Layout>
  );
}