import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDistributorOrdersFn, updateOrderStatusFn } from '../../api/order.api';
import { MapPin, PackageCheck, Loader2, ChevronDown } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'PENDING',    label: 'Kutilmoqda',     variant: 'warning'   },
  { value: 'CONFIRMED',  label: 'Tasdiqlandi',    variant: 'primary'   },
  { value: 'DELIVERING', label: 'Yetkazilmoqda', variant: 'info'      },
  { value: 'DELIVERED',  label: 'Yetkazildi',    variant: 'success'   },
  { value: 'CANCELLED',  label: 'Bekor qilindi', variant: 'danger'    },
];

const DistributorOrdersPage = () => {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['distributor-orders'],
    queryFn: fetchDistributorOrdersFn,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: updateOrderStatusFn,
    onSuccess: () => {
      toast.success('Holat yangilandi');
      queryClient.invalidateQueries({ queryKey: ['distributor-orders'] });
      setUpdatingId(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Xatolik');
      setUpdatingId(null);
    },
  });

  const orders = fetchRes?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Buyurtmalar</h1>
        <p className="text-slate-500 text-sm mt-0.5">{orders.length} ta buyurtma</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl border border-dashed border-slate-300 gap-3">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
            <PackageCheck className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Buyurtmalar yo'q</p>
          <p className="text-slate-400 text-xs">Yangi buyurtmalar bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Buyurtmachi', 'Sana', 'Manzil', 'Summa', 'Holat', 'Boshqaruv'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => {
                  const statusInfo = statusOptions.find(s => s.value === order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Buyer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {order.storeOwner?.storeName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-none">{order.storeOwner?.storeName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{order.storeOwner?.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-700">
                          {format(new Date(order.createdAt), "dd MMM yyyy", { locale: uz })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(order.createdAt), "HH:mm")}
                        </p>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4 max-w-[180px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-slate-700 line-clamp-1">{order.address}</p>
                            {order.note && (
                              <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">"{order.note}"</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-violet-600">
                          {order.totalAmount.toLocaleString('uz-UZ')} UZS
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{order.items.length} tovar</p>
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4">
                        <Badge variant={statusInfo?.variant as any}>
                          {statusInfo?.label || order.status}
                        </Badge>
                      </td>

                      {/* Status select */}
                      <td className="px-5 py-4">
                        {updatingId === order.id ? (
                          <div className="w-32 h-9 flex items-center justify-center bg-slate-100 rounded-lg">
                            <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={order.status}
                              onChange={(e) => { setUpdatingId(order.id); updateStatus({ id: order.id, status: e.target.value }); }}
                              className="appearance-none h-9 bg-white border border-slate-200 rounded-lg pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer shadow-sm"
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorOrdersPage;
