import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Package, AlertTriangle, TrendingUp, DollarSign, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SalesChart from '../../components/analytics/SalesChart';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export const DistributorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['distributor-stats'],
    queryFn: async () => {
      const response = await api.get('/distributor/analytics/dashboard');
      return response.data;
    },
    staleTime: 30000,
  });

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['distributor-recent-orders'],
    queryFn: async () => {
      const response = await api.get('/distributor/orders?limit=5');
      return response.data;
    },
    staleTime: 30000,
  });

  const stats = statsResponse?.data || {};
  const recentOrders = ordersResponse?.data?.orders || [];

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Calculate generic "Growth" metric based on salesTrend if available
  const salesTrend = stats.salesTrend || [];
  const currentSales = salesTrend[salesTrend.length - 1]?.sales || 0;
  const previousSales = salesTrend[salesTrend.length - 2]?.sales || 0;
  const growth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'warning';
      case 'ACCEPTED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'IN_TRANSIT': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xush kelibsiz, {user?.name || 'Distributor'}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Bugungi biznes ko'rsatkichlaringizni kuzating va boshqaring.</p>
        </div>
        
        {/* 5. Quick Actions */}
        <div className="flex gap-2">
          <button onClick={() => navigate('/distributor/products/add')} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all font-medium text-sm shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> Mahsulot qo'shish
          </button>
          <button onClick={() => navigate('/distributor/orders')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm">
            <Package className="w-4 h-4" /> Barcha buyurtmalar
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Bugungi tushum</p>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">{(stats.todaySales?.amount || 0).toLocaleString()} <span className="text-sm text-slate-400">UZS</span></p>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Faol buyurtmalar</p>
            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">{stats.orders?.inProgress || 0} <span className="text-sm text-slate-400 font-normal">ta</span></p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Kam qolganlar</p>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">{stats.lowStockAlerts || 0} <span className="text-sm text-slate-400 font-normal">tur</span></p>
        </div>

        {/* This Month Growth */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">O'sish dinamikasi</p>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${growth >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
              <TrendingUp className={`w-5 h-5 ${growth < 0 && 'rotate-180'}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart data={salesTrend.map((s: any) => ({ sana: s.date, sotuv: s.sales }))} title="Sotuv dinamikasi (Oxirgi 7 kun)" />
        </div>

        {/* 4. Recent Orders Table/List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">So'nggi buyurtmalar</h2>
            <button onClick={() => navigate('/distributor/orders')} className="text-sm text-sky-500 font-medium hover:text-sky-600 flex items-center gap-1 group">
              Barchasi <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex flex-col p-4 rounded-xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900">{order.client?.storeName || 'Do\'kon'}</p>
                  <p className="text-xs text-slate-400">{format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: uz })}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-[13px] font-bold text-slate-700">{order.totalAmount.toLocaleString()} UZS</p>
                  <Badge variant={getStatusColor(order.status) as any}>{order.status}</Badge>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center flex-1 h-full text-slate-400 text-sm">
                Xaridlar yo'q
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
