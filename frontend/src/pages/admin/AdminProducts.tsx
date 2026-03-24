import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const AdminProducts = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: async () => {
      const res = await api.get(`/admin/products?page=${page}`);
      return res.data.data;
    },
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/products/${id}/deactivate`),
    onSuccess: () => { toast.success('Deaktiv qilindi'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
  });

  const products = data?.products || [];
  const total    = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="fade-in space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mahsulotlar</h1>
        <p className="text-slate-500 text-sm mt-0.5">{total} ta mahsulot</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-violet-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mahsulot</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Distribyutor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Narx</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Holat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.distributor?.companyName}</td>
                  <td className="px-4 py-3 font-medium text-violet-600">{p.price.toLocaleString('uz-UZ')} UZS</td>
                  <td className="px-4 py-3">
                    {p.isActive ? <Badge variant="success">Faol</Badge> : <Badge variant="danger">Nofaol</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.isActive && (
                      <Button size="sm" variant="danger" onClick={() => deactivate(p.id)}>
                        <EyeOff className="w-3.5 h-3.5 mr-1" />
                        Deaktiv
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">Mahsulotlar topilmadi</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Oldingi
          </Button>
          <span className="text-sm text-slate-600 px-2 flex items-center">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
