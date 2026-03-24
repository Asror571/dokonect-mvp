import React, { useState } from 'react';
import { Users, ShoppingCart, TrendingUp, Package, Loader2 } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import SalesChart from '../../components/analytics/SalesChart';
import { useAdminOverview, useAdminRevenue, useAdminOrders } from '../../hooks/useAnalytics';

const periods = [
  { label: '7 kun', value: '7d' },
  { label: '30 kun', value: '30d' },
  { label: '90 kun', value: '90d' },
];

const AdminDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const { data: overview, isLoading } = useAdminOverview();
  const { data: revenue = [] }        = useAdminRevenue(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform statistikasi</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Jami foydalanuvchilar" value={overview?.totalUsers || 0} icon={Users} color="violet" />
        <StatsCard title="Jami buyurtmalar" value={overview?.totalOrders || 0} icon={ShoppingCart} color="blue" />
        <StatsCard
          title="Jami daromad"
          value={`${((overview?.totalRevenue || 0) / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="emerald"
          subtitle="UZS"
        />
        <StatsCard title="Mahsulotlar" value={overview?.totalProducts || 0} icon={Package} color="amber" />
      </div>

      <SalesChart data={revenue} title="Daromad grafigi" />
    </div>
  );
};

export default AdminDashboard;
