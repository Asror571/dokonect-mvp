import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const statusLabels: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlangan',
  DELIVERING: 'Yetkazilmoqda', DELIVERED: 'Yetkazildi', CANCELLED: 'Bekor',
};
const statusVariants: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'primary',
  DELIVERING: 'secondary', DELIVERED: 'success', CANCELLED: 'danger',
};

const AdminOrders = () => {
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: async () => {
      const res = await api.get(`/admin/orders?status=${status}&page=${page}`);
      return res.data.data;
    },
  });

  const orders = data?.orders || [];
  const total  = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Buyurtmalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} ta buyurtma</p>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 bg-white border border-slate-200 rounded-xl px-3 text-sm focus:outline-none"
        >
          <option value="">Barcha statuslar</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-violet-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Do'kon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Distribyutor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Summa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">#{o.id.slice(-6)}</td>
                  <td className="px-4 py-3 text-slate-700">{o.storeOwner?.storeName}</td>
                  <td className="px-4 py-3 text-slate-700">{o.distributor?.companyName}</td>
                  <td className="px-4 py-3 font-semibold text-violet-600">{o.totalAmount.toLocaleString('uz-UZ')} UZS</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariants[o.status]}>{statusLabels[o.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(o.createdAt), 'dd.MM.yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">Buyurtmalar topilmadi</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Oldingi</Button>
          <span className="text-sm text-slate-600 px-2 flex items-center">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Keyingi</Button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
