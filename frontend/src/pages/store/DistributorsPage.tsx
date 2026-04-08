import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Search, MapPin, Star, Link as LinkIcon, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const DistributorsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  const { data: distributors, isLoading } = useQuery({
    queryKey: ['distributors', search, region],
    queryFn: async () => {
      const res = await api.get('/client/distributors', { params: { search, region } });
      return res.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (distributorId: string) => {
      return api.post(`/client/distributors/${distributorId}/connect`);
    },
    onSuccess: () => {
      toast.success('Ulanish so\'rovi yuborildi');
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ulangan</Badge>;
      case 'PENDING':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Kutilmoqda</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rad etilgan</Badge>;
      case 'BLOCKED':
        return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Bloklangan</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Distribyutorlar</h1>
          <p className="text-slate-500 font-medium mt-1">Yangi hamkorlar toping va mahsulotlariga ulaning.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Nomi bo'yicha qidirish..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:w-64 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <select
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium appearance-none"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">Barcha hududlar</option>
            <option value="Toshkent">Toshkent</option>
            <option value="Samarqand">Samarqand</option>
            <option value="Andijon">Andijon</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-slate-100 animate-pulse rounded-[32px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {distributors?.map((dist: any) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={dist.id}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform">
                    {dist.logo ? (
                      <img src={dist.logo} alt={dist.companyName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-2xl font-black text-indigo-500">{dist.companyName.slice(0, 1)}</div>
                    )}
                  </div>
                  {getStatusBadge(dist.linkStatus)}
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {dist.companyName}
                </h3>
                
                <div className="flex items-center gap-4 text-sm font-bold text-slate-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{dist.rating || '0.0'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{dist.region || 'Toshkent'}</span>
                  </div>
                </div>

                {dist.linkStatus === 'NONE' ? (
                  <button
                    onClick={() => connectMutation.mutate(dist.id)}
                    disabled={connectMutation.isPending}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {connectMutation.isPending ? 'Yuborilmoqda...' : 'Ulanish so\'rovi'}
                  </button>
                ) : dist.linkStatus === 'APPROVED' ? (
                  <button
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                  >
                    Katalogni ko'rish
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed"
                  >
                    {dist.linkStatus === 'PENDING' ? 'Kutilmoqda' : 'Ulanish imkonsiz'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && distributors?.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Distribyutorlar topilmadi</p>
        </div>
      )}
    </div>
  );
};

export default DistributorsPage;
