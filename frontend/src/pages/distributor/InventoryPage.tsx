import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Package, AlertCircle, Warehouse, History, Search, Download } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ['distributor-inventory'],
    queryFn: async () => {
      const response = await api.get('/distributor/inventory');
      return response.data?.data?.inventory || [];
    },
    staleTime: 30000,
  });

  const inventory = inventoryResponse || [];
  const filteredInventory = inventory.filter((inv: any) => 
    inv.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 underline underline-offset-8 decoration-sky-500 decoration-2">Sklad va Inventar</h1>
          <p className="text-slate-500 text-sm mt-1">Mahsulotlar qoldig'i va omborlardagi zaxirani boshqaring.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2 px-4 py-2 text-sm bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 transition-all font-medium">
            <Download className="w-4 h-4" /> Eksport (Excel)
          </Button>
          <Button variant="secondary" className="gap-2 px-4 py-2 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium">
            <History className="w-4 h-4" /> Tarix (History)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jami mahsulotlar</p>
          <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kam qolganlar (Critical)</p>
          <p className="text-2xl font-bold text-red-500">
            {inventory.filter((inv: any) => inv.isLowStock).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Band qilingan (Reserved)</p>
          <p className="text-2xl font-bold text-amber-500 uppercase tracking-tighter">
            {inventory.reduce((acc: number, inv: any) => acc + inv.reserved, 0)} <span className="text-xs text-slate-400">dona</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-400">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Omborlar soni</p>
          <p className="text-2xl font-bold text-sky-500">
            {[...new Set(inventory.map((inv: any) => inv.warehouseId))].length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Mahsulot yoki SKU orqali qidirish..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all bg-slate-50 focus:bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Barcha omborlar</option>
              {[...new Set(inventory.map((inv: any) => inv.warehouse?.name))].map((w: any) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Mahsulot</th>
                <th className="px-6 py-4">Sklad / Ombor</th>
                <th className="px-6 py-4">Jami (Total)</th>
                <th className="px-6 py-4">Band (Blocked)</th>
                <th className="px-6 py-4">Sotuvda (Available)</th>
                <th className="px-6 py-4">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInventory.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                        {inv.product?.images?.[0]?.url ? (
                          <img src={inv.product.images[0].url} alt={inv.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{inv.product?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">{inv.product?.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Warehouse className="w-4 h-4 text-slate-300" />
                      <span className="font-semibold text-xs tracking-tighter uppercase">{inv.warehouse?.name || 'Asosiy ombor'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{inv.quantity}</td>
                  <td className="px-6 py-4 text-amber-500 font-bold">{inv.reserved}</td>
                  <td className={`px-6 py-4 font-bold ${inv.available <= inv.minThreshold ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                    {inv.available}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={inv.available <= inv.minThreshold ? 'danger' : 'success'}>
                      {inv.available <= inv.minThreshold ? 'Kam qolgan' : 'Zaxira bor'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Inventar topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
