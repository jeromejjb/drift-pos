import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  GripVertical,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { playOrderNotificationSound } from '../lib/orderSound';
import io from 'socket.io-client';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

interface Order {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  status: OrderStatus;
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

const STATUS_COLUMNS: { id: OrderStatus; label: string; icon: typeof Timer }[] = [
  { id: 'pending', label: 'Pending', icon: Timer },
  { id: 'preparing', label: 'Preparing', icon: ChefHat },
  { id: 'ready', label: 'Ready', icon: UtensilsCrossed },
  { id: 'served', label: 'Served', icon: CheckCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'cancelled', label: 'Cancelled', icon: AlertCircle },
];

const statusConfig: Record<OrderStatus, { icon: typeof Timer; label: string; color: string; iconColor: string }> = {
  pending: { icon: Timer, label: 'Pending', color: 'bg-amber-50 text-amber-700', iconColor: 'text-amber-600' },
  preparing: { icon: ChefHat, label: 'Preparing', color: 'bg-blue-50 text-blue-700', iconColor: 'text-blue-600' },
  ready: { icon: UtensilsCrossed, label: 'Ready', color: 'bg-emerald-50 text-emerald-700', iconColor: 'text-emerald-600' },
  served: { icon: CheckCircle, label: 'Served', color: 'bg-gray-100 text-gray-600', iconColor: 'text-gray-500' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'bg-gray-100 text-gray-600', iconColor: 'text-gray-500' },
  cancelled: { icon: AlertCircle, label: 'Cancelled', color: 'bg-red-50 text-red-600', iconColor: 'text-red-500' },
};

function OrderCard({
  order,
  isDragging,
  isOverlay,
}: {
  order: Order;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const config = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all
        ${isDragging ? 'opacity-90 shadow-lg ring-2 ring-black/10' : ''}
        ${isOverlay ? 'cursor-grabbing shadow-xl rotate-1' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900">{getTableLabel(order.tableNumber)}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {formatRelativeTime(order.createdAt)} · #{order.id.slice(-6)}
          </p>
        </div>
        <span className="text-lg font-semibold text-gray-900 shrink-0">${order.total.toFixed(2)}</span>
      </div>
      <div className="border-t border-gray-100 pt-3 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.quantity}× {item.name}
            </span>
            <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableOrderCard({
  order,
  onStatusChange,
  updatingId,
}: {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  updatingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="flex items-start gap-2">
          <div className="mt-4 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <OrderCard order={order} isDragging={isDragging} />
            {!['served', 'completed', 'cancelled'].includes(order.status) && (
              <div className="mt-2">
                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                  disabled={updatingId === order.id}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusColumn({
  statusId,
  label,
  icon: Icon,
  orders,
  onStatusChange,
  updatingId,
}: {
  statusId: OrderStatus;
  label: string;
  icon: typeof Timer;
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  updatingId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: statusId });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-72 rounded-2xl border-2 border-dashed p-4 min-h-[200px] transition-colors
        ${isOver ? 'border-black/30 bg-gray-50/80' : 'border-gray-200 bg-gray-50/30'}
      `}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="space-y-0">
        {orders.map((order) => (
          <DraggableOrderCard
            key={order.id}
            order={order}
            onStatusChange={onStatusChange}
            updatingId={updatingId}
          />
        ))}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { restaurantId } = useParams();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const prevOrderCountRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const token = typeof window !== 'undefined' ? localStorage.getItem('drift-token') : null;

  const fetchOrders = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    if (orderId.startsWith('fall-')) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setUpdatingId(null);
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('drift-token') : null;
      const res = await fetch(`${API_URL}/api/order/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

  const getVisibleColumns = () => {
    if (filter === 'active') return STATUS_COLUMNS.slice(0, 4); // Pending, Preparing, Ready, Served
    if (filter === 'completed') return STATUS_COLUMNS.slice(3, 5); // Served, Completed
    return STATUS_COLUMNS;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find((o) => o.id === active.id);
    if (order) setActiveOrder(order);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);
    if (!over) return;
    const orderId = String(active.id);
    const newStatus = over.id as OrderStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;
    if (!STATUS_COLUMNS.some((c) => c.id === newStatus)) return;
    updateStatus(orderId, newStatus);
  };

  const summary = {
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    total: orders.reduce((s, o) => s + o.total, 0),
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['active', 'all', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {getVisibleColumns().map((col) => (
              <StatusColumn
                key={col.id}
                statusId={col.id}
                label={col.label}
                icon={col.icon}
                orders={filteredOrders.filter((o) => o.status === col.id)}
                onStatusChange={updateStatus}
                updatingId={updatingId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder ? (
              <div className="w-72">
                <OrderCard order={activeOrder} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  );
}
