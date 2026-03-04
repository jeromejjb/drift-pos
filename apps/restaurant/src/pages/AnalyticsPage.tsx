import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  period: string;
  revenue: { current: number; previous: number; changePercent: number };
  orders: { current: number; previous: number; changePercent: number };
  avgCheck: { current: number; previous: number; changePercent: number };
  byDay: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; revenue: number; orders: number }[];
  loyaltyMembers: number;
}

export function AnalyticsPage() {
  const { restaurantId } = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [periodOpen, setPeriodOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('drift-token') : null;

  useEffect(() => {
    if (!restaurantId || !token) return;
    setLoading(true);
    fetch(`${API_URL}/api/restaurant/${restaurantId}/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [restaurantId, period, token]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Analytics">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-600 text-sm">
            Analytics will appear once you have orders. Place some orders or run the seed to see insights.
          </p>
        </div>
      </Layout>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue',
      value: `$${data.revenue.current.toFixed(2)}`,
      sub: `vs $${data.revenue.previous.toFixed(2)} prev`,
      change: data.revenue.changePercent,
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Orders',
      value: data.orders.current.toString(),
      sub: `vs ${data.orders.previous} prev`,
      change: data.orders.changePercent,
      icon: ShoppingBag,
      color: 'blue',
    },
    {
      label: 'Avg Check',
      value: `$${data.avgCheck.current.toFixed(2)}`,
      sub: `vs $${data.avgCheck.previous.toFixed(2)} prev`,
      change: data.avgCheck.changePercent,
      icon: Receipt,
      color: 'violet',
    },
    {
      label: 'Loyalty Members',
      value: data.loyaltyMembers.toString(),
      sub: 'Signed-in diners',
      change: null,
      icon: Users,
      color: 'amber',
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
  };

  return (
    <Layout title="Analytics">
      <div className="space-y-8">
        {/* Period selector */}
        <div className="flex justify-end">
          <div className="relative">
            <button
              onClick={() => setPeriodOpen(!periodOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Last {period === '7d' ? '7 days' : '30 days'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {periodOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                <div className="absolute right-0 mt-1 py-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={() => { setPeriod('7d'); setPeriodOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${period === '7d' ? 'bg-gray-50 font-medium' : ''}`}
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => { setPeriod('30d'); setPeriodOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${period === '30d' ? 'bg-gray-50 font-medium' : ''}`}
                  >
                    Last 30 days
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${colorMap[kpi.color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {kpi.change !== null && (
                  <div className="mt-3 flex items-center gap-1">
                    {kpi.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">vs previous period</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  labelFormatter={formatDate}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top items by revenue</h3>
          {data.topItems.length === 0 ? (
            <p className="text-gray-500 text-sm">No items yet</p>
          ) : (
            <div className="space-y-3">
              {data.topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">${item.revenue.toFixed(2)}</span>
                    <span className="text-gray-400 text-sm ml-2">({item.orders} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
