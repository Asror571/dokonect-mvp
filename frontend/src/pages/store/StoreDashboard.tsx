import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Package, Truck, Clock, DollarSign, ArrowRight, Wallet, Users, ShoppingCart, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion } from 'framer-motion';

const StoreDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['store-dashboard-data'],
    queryFn: async () => {
      const [ordersRes, financeRes, distRes] = await Promise.all([
        api.get('/client/orders'),
        api.get('/client/finance/summary'),
        api.get('/client/distributors')
      ]);
      return {
        orders: ordersRes.data || [],
        finance: financeRes.data || {},
        distributors: distRes.data || []
      };
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  const { orders, finance, distributors } = dashboardData!;
  const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
  const activeOrdersCount = Array.isArray(orders) ? orders.filter((o: any) => ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status)).length : 0;
  const connectedDistCount = Array.isArray(distributors) ? distributors.filter((d: any) => d.linkStatus === 'APPROVED').length : 0;

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

  const stats = [
    { label: 'Faol qarz', value: `${finance?.totalDebt?.toLocaleString() || 0} UZS`, icon: Wallet, color: 'bg-indigo-600', trend: 'Moliya bo\'limi' },
    { label: 'Bu oy xarid', value: `${finance?.totalSpent?.toLocaleString() || 0} UZS`, icon: ShoppingCart, color: 'bg-emerald-500', trend: 'Aktiv' },
    { label: 'Buyurtmalar', value: activeOrdersCount.toString(), icon: Package, color: 'bg-amber-500', trend: 'Jarayonda' },
    { label: 'Ulangan dist.', value: connectedDistCount.toString(), icon: Users, color: 'bg-sky-500', trend: 'Hamkorlar' },
  ];

  return (
    <div className="fade-in space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Salom, {user?.name}! 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Do'koningizdagi oxirgi harakatlarni kuzating.</p>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={() => navigate('/store/catalog')} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                <ShoppingCart className="w-4 h-4" /> Yangi xaridlar
             </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer"
            onClick={() => {
                if (stat.label.includes('qarz')) navigate('/store/finance');
                if (stat.label.includes('Buyurtma')) navigate('/store/orders');
                if (stat.label.includes('dist')) navigate('/store/distributors');
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-xl shadow-black/5`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">{stat.trend}</span>
            </div>
            <p className="text-sm font-bold text-slate-500">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">So'nggi buyurtmalar</h2>
            </div>
            <button onClick={() => navigate('/store/orders')} className="text-sm font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-2">
              Barchasi <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">ID</th>
                  <th className="px-8 py-4">Distribyutor</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/store/orders/${order.id}`)}>
                    <td className="px-8 py-5">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-indigo-500 font-mono">ORD-{order.id.slice(0, 8)}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{format(new Date(order.createdAt), "dd MMM", { locale: uz })}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{order.distributor?.companyName}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <Badge variant={getStatusColor(order.status) as any} className="font-black text-[10px] tracking-widest uppercase py-1.5 px-3">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                        <p className="text-sm font-black text-slate-900">{order.totalAmount.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">UZS</p>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center flex flex-col items-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-slate-300" />
                         </div>
                         <p className="text-slate-400 font-black tracking-tight">Hozircha buyurtmalar yo'q</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="space-y-6">
            {/* Quick Order Widget */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20">
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight mb-2">Tezkor Buyurtma</h3>
                    <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">
                        Doimiy mahsulotlaringizni bir bosish bilan qayta buyurtma qiling.
                    </p>
                    <button onClick={() => navigate('/store/catalog')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                        Katalogga o'tish
                    </button>
                </div>
            </div>

            {/* Debt Alert Widget */}
            {finance?.overdueDebt > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-[40px] p-8">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertTriangle className="w-6 h-6" />
                        <h3 className="text-lg font-black tracking-tight">To'lov kechikmoqda</h3>
                    </div>
                    <p className="text-red-900/60 text-sm font-bold mb-6">
                        Sizning {finance.overdueDebt.toLocaleString()} UZS miqdoridagi qarzdorligingiz muddati o'tgan.
                    </p>
                    <button onClick={() => navigate('/store/finance')} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all">
                        To'lovni amalga oshirish
                    </button>
                </div>
            )}

            {/* Support Widget */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-[40px] p-8">
                <h3 className="text-lg font-black text-indigo-900 tracking-tight mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Haridingiz o'smoqda
                </h3>
                <p className="text-indigo-900/60 text-sm font-bold mb-4">
                    O'tgan oyga nisbatan siz 12% ko'proq xarid qildingiz. Kredit limitini oshirishni xohlaysizmi?
                </p>
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden mb-6">
                    <div className="w-[85%] h-full bg-indigo-600 rounded-full" />
                </div>
                <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">
                    Batafsil ma'lumot →
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;

const AlertTriangle = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
