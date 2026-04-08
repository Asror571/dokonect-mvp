import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  TrendingUp,
  AlertTriangle,
  Package,
  Truck
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const GlobalDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-global-dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: growthData } = useQuery({
    queryKey: ['admin-growth-chart'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/growth?period=30');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const stats = dashboardData || {};
  const gmv = stats.gmv || {};
  const orders = stats.orders || {};
  const users = stats.users || {};
  const debt = stats.debt || {};
  const products = stats.products || {};
  const platform = stats.platform || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-slate-400 mt-1">Global analytics and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-sm text-slate-400">Platform Revenue</span>
            <p className="text-xl font-bold text-emerald-400">
              {platform.revenue?.toLocaleString()} UZS
            </p>
            <span className="text-xs text-slate-500">
              Commission: {platform.commission}%
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-800/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            {gmv.growth !== undefined && (
              <Badge variant={gmv.growth >= 0 ? 'success' : 'danger'}>
                {gmv.growth >= 0 ? '+' : ''}{gmv.growth.toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-1">Total GMV</p>
          <p className="text-3xl font-bold text-emerald-400">
            {(gmv.total || 0).toLocaleString()}
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-800/30 flex justify-between text-xs">
            <span className="text-slate-400">Today: {(gmv.today || 0).toLocaleString()}</span>
            <span className="text-slate-400">Month: {(gmv.month || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-800/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-blue-400">{orders.total || 0}</p>
          <div className="mt-3 pt-3 border-t border-blue-800/30 flex justify-between text-xs">
            <span className="text-slate-400">Today: {orders.today || 0}</span>
            <span className="text-slate-400">Active: {orders.active || 0}</span>
          </div>
        </div>

        {/* Users */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-800/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-1">Active Users</p>
          <p className="text-3xl font-bold text-purple-400">
            {(users.distributors?.active || 0) + (users.shops?.active || 0)}
          </p>
          <div className="mt-3 pt-3 border-t border-purple-800/30 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Distributors</span>
              <p className="text-purple-400 font-semibold">{users.distributors?.total || 0}</p>
            </div>
            <div>
              <span className="text-slate-500">Shops</span>
              <p className="text-purple-400 font-semibold">{users.shops?.total || 0}</p>
            </div>
          </div>
        </div>

        {/* Debt */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 border border-red-800/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-1">Total Debt</p>
          <p className="text-3xl font-bold text-red-400">
            {(debt.total || 0).toLocaleString()}
          </p>
          <div className="mt-3 pt-3 border-t border-red-800/30 flex justify-between text-xs">
            <span className="text-slate-400">Overdue: {(debt.overdue || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">GMV Growth Trend</h2>
            <p className="text-sm text-slate-400">Last 30 days</p>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        {growthData && growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => format(new Date(value), 'PPP', { locale: uz })}
              />
              <Line
                type="monotone"
                dataKey="gmv"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            No data available
          </div>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Products</p>
              <p className="text-2xl font-bold">{products.total || 0}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Low stock: <span className="text-amber-400 font-semibold">{products.lowStock || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Drivers</p>
              <p className="text-2xl font-bold">{users.drivers?.total || 0}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Online: <span className="text-cyan-400 font-semibold">{users.drivers?.online || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Shops</p>
              <p className="text-2xl font-bold">{users.shops?.active || 0}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Total: <span className="text-violet-400 font-semibold">{users.shops?.total || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {stats.recentOrders?.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{order.client?.storeName || 'Shop'}</p>
                  <p className="text-xs text-slate-400">
                    {order.distributor?.user?.name || 'Distributor'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{order.totalAmount.toLocaleString()} UZS</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(order.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {stats.recentUsers?.slice(0, 5).map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-400">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.phone}</p>
                  </div>
                </div>
                <Badge variant={user.role === 'DISTRIBUTOR' ? 'primary' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;
