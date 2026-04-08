import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { BarChart3, TrendingUp, Users, ShoppingBag, Truck, Calendar, Download, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('7d');

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['distributor-analytics', period],
    queryFn: async () => {
      const res = await api.get(`/distributor/analytics/dashboard?period=${period}`);
      return res.data?.data || {};
    },
    staleTime: 60000,
  });

  const stats = statsResponse || {};
  const salesData = (stats.salesTrend || []).map((s: any) => ({
    name: s.date,
    sales: s.sales,
    orders: s.orders,
  }));

  const topProducts = (stats.topProducts || []).map((p: any) => ({
    name: p.product?.name?.slice(0, 15) + '...',
    value: p.revenue,
    quantity: p.quantity,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 underline decoration-indigo-500 decoration-2 underline-offset-8 uppercase font-black tracking-widest">Savdo va Tahlil</h1>
          <p className="text-slate-500 text-sm mt-1">Sizning biznesingiz chuqur statistikasi va tahlili.</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase tracking-tight"
          >
            <option value="7d">Oxirgi 7 kun</option>
            <option value="30d">Oxirgi 30 kun</option>
            <option value="90d">Oxirgi 90 kun</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20 uppercase tracking-widest">
            <Download className="w-4 h-4" /> Hisobot Yuklash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Umumiy Savdo</p>
          <p className="text-2xl font-black text-slate-900">{(stats.todaySales?.amount || 0).toLocaleString()} <span className="text-xs text-indigo-400">UZS</span></p>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold mt-4">
            <TrendingUp className="w-3 h-3" /> +12.5% o'sish
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Buyurtmalar</p>
          <p className="text-2xl font-black text-slate-900">{stats.orders?.total || 0} <span className="text-xs text-amber-400">ta</span></p>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold mt-4">
            <ShoppingBag className="w-3 h-3" /> Faollik yuqori
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Haydovchilar</p>
          <p className="text-2xl font-black text-slate-900">{stats.activeDrivers || 0} <span className="text-xs text-sky-400">faol</span></p>
          <div className="flex items-center gap-2 text-sky-500 text-xs font-bold mt-4">
            <Truck className="w-3 h-3" /> Harakatdagi
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">O'rtacha Chek</p>
          <p className="text-2xl font-black text-slate-900">125,000 <span className="text-xs text-emerald-400">UZS</span></p>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold mt-4">
            <TrendingUp className="w-3 h-3" /> Barqaror
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8 border-b pb-4 flex items-center gap-3 uppercase tracking-widest">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Savdo Dinamikasi
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8 border-b pb-4 flex items-center gap-3 uppercase tracking-widest">
            <ShoppingBag className="w-5 h-5 text-amber-500" /> Eng ko'p sotilgan Mahsulotlar
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 'bold'}} width={100} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={25}>
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#fbbf24', '#38bdf8', '#4ade80', '#f472b6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
