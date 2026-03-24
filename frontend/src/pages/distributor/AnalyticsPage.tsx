import React, { useState } from 'react';
import { TrendingUp, Package, ShoppingCart, Clock, Loader2 } from 'lucide-react';
import StatsCard from '../../components/analytics/StatsCard';
import SalesChart from '../../components/analytics/SalesChart';
import TopProductsChart from '../../components/analytics/TopProductsChart';
import {
  useDistributorOverview, useDistributorSales,
  useDistributorTopProducts, useDistributorTopStores,
} from '../../hooks/useAnalytics';

const periods = [
  { label: '7 kun', value: '7d' },
  { label: '30 kun', value: '30d' },
  { label: '90 kun', value: '90d' },
];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('7d');

  const { data: overview, isLoading: ovLoading } = useDistributorOverview();
  const { data: sales = [] }                      = useDistributorSales(period);
  const { data: topProducts = [] }                = useDistributorTopProducts();
  const { data: topStores = [] }                  = useDistributorTopStores();

  if (ovLoading) {
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
          <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Biznesingiz statistikasi</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Jami buyurtmalar" value={overview?.totalOrders || 0} icon={ShoppingCart} color="violet" />
        <StatsCard
          title="Jami daromad"
          value={`${((overview?.totalRevenue || 0) / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          color="emerald"
          subtitle="UZS"
        />
        <StatsCard title="Mahsulotlar" value={overview?.totalProducts || 0} icon={Package} color="blue" />
        <StatsCard title="Kutilayotgan" value={overview?.pendingOrders || 0} icon={Clock} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesChart data={sales} title={`Sotuv (${periods.find(p => p.value === period)?.label})`} />
        <TopProductsChart data={topProducts} />
      </div>

      {/* Top Stores */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top do'konlar</h3>
        <div className="space-y-3">
          {topStores.map((store: any, i: number) => (
            <div key={store.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{store.storeName}</p>
                <p className="text-xs text-slate-400">{store.orderCount} buyurtma</p>
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                {(store.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          ))}
          {topStores.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
