import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Tag, Percent, Plus, Trash2, Edit2, Ticket, Users, History, Info } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const PricingPage = () => {
  const [activeTab, setActiveTab] = useState<'promo' | 'bulk'>('promo');

  const { data: promoCodes } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const response = await api.get('/distributor/pricing/promo-codes');
      return response.data?.data || [];
    },
    staleTime: 30000,
  });

  const { data: bulkRules } = useQuery({
    queryKey: ['bulk-rules'],
    queryFn: async () => {
      const response = await api.get('/distributor/pricing/bulk-rules');
      return response.data?.data || [];
    },
    staleTime: 30000,
  });

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 underline decoration-indigo-500 underline-offset-8">Narxlash va Kampaniyalar</h1>
          <p className="text-slate-500 text-sm mt-1">Sotuvni oshirish uchun promo-kodlar va ulgurji chegirmalarni boshqaring.</p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> {activeTab === 'promo' ? "Yangi promo-kod" : "Yangi chegirma qoidasi"}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('promo')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'promo' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Ticket className="w-4 h-4" /> Promo-kodlar
        </button>
        <button 
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'bulk' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" /> Ulgurji (Bulk) chegirmalar
        </button>
      </div>

      {activeTab === 'promo' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(promoCodes || []).map((promo: any) => (
            <div key={promo.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500 opacity-20" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Tag className="w-6 h-6" />
                </div>
                <Badge variant={promo.status === 'ACTIVE' ? 'success' : 'secondary'}>{promo.status}</Badge>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tighter uppercase">{promo.code}</h3>
              <p className="text-sm text-slate-500 mb-4">{promo.description || 'Chegirma kampaniyasi'}</p>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4 border border-indigo-50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Miqdori:</span>
                  <span className="font-bold text-indigo-600">{promo.discountType === 'PERCENT' ? `${promo.discountValue}%` : `${promo.discountValue} UZS`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Min. Buyurtma:</span>
                  <span className="font-bold text-slate-700">{promo.minOrderValue?.toLocaleString()} UZS</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors uppercase tracking-widest">Tahrirlash</button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {!promoCodes?.length && (
            <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
              <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium tracking-tight">Hali promo-kodlar yaratilmagan</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Qoida nomi</th>
                <th className="px-6 py-4">Mahsulot</th>
                <th className="px-6 py-4">Shart (Quantity)</th>
                <th className="px-6 py-4">Chegirma</th>
                <th className="px-6 py-4">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(bulkRules || []).map((rule: any) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 uppercase tracking-tighter">{rule.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100" />
                      <span className="text-slate-600 font-medium">{rule.product?.name || 'Barcha mahsulotlar'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">{rule.minQuantity}+ dona xaridda</td>
                  <td className="px-6 py-4 text-emerald-600 font-black">{rule.discountType === 'PERCENT' ? `${rule.discountValue}%` : `${rule.discountValue} UZS`}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!bulkRules?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chegirma qoidalari topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
