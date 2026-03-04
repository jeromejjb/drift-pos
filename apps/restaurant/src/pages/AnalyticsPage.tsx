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
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
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

type Period = '7d' | '14d' | '30d' | '90d';
type ChartMetric = 'revenue' | 'orders' | 'both';

export function AnalyticsPage() {
  const { restaurantId } = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'auth' | 'server' | null>(null);
  const [period, setPeriod] = useState<Period>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('both');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [metricOpen, setMetricOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const token = typeof window !== 'undefined' ? localStorage.getItem('drift-token') : null;

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    if (!token) {
      setError('auth');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    fetch(`${API_URL}/api/restaurant/${restaurantId}/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setError('auth');
          return null;
        }
        if (!r.ok) {
          setError('server');
          return null;
        }
        return r.json();
      })
      .then(setData)
      .catch(() => {
        setError('server');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [restaurantId, period, token]);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (v: number) => `$${v.toFixed(2)}`;

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

  if (error === 'auth') {
    return (
      <Layout title="Analytics">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in required</h3>
          <p className="text-gray-600 text-sm mb-4">Please sign in to view analytics.</p>
          <a
            href={`${import.meta.env.VITE_LANDING_URL || 'https://driftpos.com'}/login`}
            className="inline-block px-6 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800"
          >
            Sign in
          </a>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Analytics">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error === 'server' ? 'Could not load analytics' : 'No data yet'}
          </h3>
          <p className="text-gray-600 text-sm">
            {error === 'server'
              ? 'The server may be updating. Try again in a moment.'
              : 'Run the seed for demo data: cd apps/api && npx prisma db seed'}
          </p>
        </div>
      </Layout>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue',
      value: formatCurrency(data.revenue.current),
      sub: `vs ${formatCurrency(data.revenue.previous)} prev`,
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
      value: formatCurrency(data.avgCheck.current),
      sub: `vs ${formatCurrency(data.avgCheck.previous)} prev`,
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

  const periodLabels: Record<Period, string> = {
    '7d': 'Last 7 days',
    '14d': 'Last 14 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  const metricLabels: Record<ChartMetric, string> = {
    revenue: 'Revenue',
    orders: 'Orders',
    both: 'Revenue & Orders',
  };

  const chartData = data.byDay?.length ? data.byDay : [];
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);

  return (
    <Layout title="Analytics">
      <div className="space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <h2 className="text-lg font-medium text-gray-700">Overview</h2>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => { setPeriodOpen(false); setMetricOpen(!metricOpen); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4" />
                {metricLabels[chartMetric]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {metricOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMetricOpen(false)} />
                  <div className="absolute right-0 mt-1 py-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px]">
                    {(['revenue', 'orders', 'both'] as ChartMetric[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setChartMetric(m); setMetricOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${chartMetric === m ? 'bg-gray-50 font-medium' : ''}`}
                      >
                        {metricLabels[m]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setMetricOpen(false); setPeriodOpen(!periodOpen); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4" />
                {periodLabels[period]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {periodOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                  <div className="absolute right-0 mt-1 py-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[140px]">
                    {(['7d', '14d', '30d', '90d'] as Period[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${period === p ? 'bg-gray-50 font-medium' : ''}`}
                      >
                        {periodLabels[p]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
                    <span className="text-xs text-gray-400">vs prev</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {chartMetric === 'revenue' ? 'Revenue' : chartMetric === 'orders' ? 'Orders' : 'Revenue & orders'} by day
          </h3>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                  {(chartMetric === 'revenue' || chartMetric === 'both') && (
                    <YAxis
                      yAxisId="revenue"
                      tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                      tick={{ fontSize: 12 }}
                      domain={[0, maxRevenue * 1.1 || 'auto']}
                    />
                  )}
                  {(chartMetric === 'orders' || chartMetric === 'both') && (
                    <YAxis
                      yAxisId="orders"
                      orientation={chartMetric === 'both' ? 'right' : 'left'}
                      tick={{ fontSize: 12 }}
                      domain={[0, Math.ceil(maxOrders * 1.1) || 'auto']}
                    />
                  )}
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                    labelFormatter={formatDate}
                  />
                  {chartMetric !== 'orders' && (
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="revenue"
                    />
                  )}
                  {chartMetric !== 'revenue' && (
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="orders"
                    />
                  )}
                  {chartMetric === 'both' && <Legend />}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data in this period</p>
                  <p className="text-xs mt-1">Orders will appear here once placed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top items by revenue</h3>
          {data.topItems && data.topItems.length > 0 ? (
            <div className="space-y-3">
              {data.topItems.map((item, i) => (
                <div key={`${item.name}-${i}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                    <span className="text-gray-400 text-sm ml-2">({item.orders} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items sold in this period</p>
            </div>
          )}
        </div>

        {/* Orders by day table */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-600">Date</th>
                    <th className="text-right py-3 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 font-medium text-gray-600">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={row.date} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 text-gray-900">{formatDate(row.date)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 text-right">{row.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
