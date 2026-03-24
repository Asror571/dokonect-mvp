import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrdersFn } from '../../api/order.api';
import { Package, Clock, ShieldCheck, MapPin, CheckCircle2, PackageCheck, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const statusMap: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
  PENDING:    { label: 'Kutilmoqda',     variant: 'warning',   icon: <Clock className="w-3 h-3" /> },
  CONFIRMED:  { label: 'Tasdiqlandi',    variant: 'primary',   icon: <ShieldCheck className="w-3 h-3" /> },
  DELIVERING: { label: 'Yetkazilmoqda', variant: 'info',      icon: <Package className="w-3 h-3" /> },
  DELIVERED:  { label: 'Yetkazildi',    variant: 'success',   icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED:  { label: 'Bekor qilindi', variant: 'danger',    icon: null },
};

const StoreOrdersPage = () => {
  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrdersFn,
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
    <div className="page fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Buyurtmalarim</h1>
        <p className="text-slate-500 text-sm mt-0.5">{orders.length} ta buyurtma</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-dashed border-slate-300 gap-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <PackageCheck className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Buyurtmalar yo'q</p>
          <p className="text-slate-400 text-xs">Katalogdan mahsulot tanlab birinchi buyurtmani bering</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = statusMap[order.status] || { label: order.status, variant: 'secondary', icon: null };
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Order header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">#{order.id.slice(0, 8)}</span>
                    <Badge variant={status.variant} className="gap-1">
                      {status.icon}{status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: uz })}
                    </span>
                    <span className="font-bold text-violet-600 text-sm">
                      {order.totalAmount.toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-4 grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Distribyutor</p>
                      <p className="text-sm font-medium text-slate-700">{order.distributor?.companyName}</p>
                      <p className="text-xs text-slate-400">{order.distributor?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Manzil</p>
                      <p className="text-sm font-medium text-slate-700">{order.address}</p>
                      {order.note && <p className="text-xs text-slate-400 italic mt-0.5">"{order.note}"</p>}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 pb-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Mahsulotlar ({order.items?.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                        <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate">
                          {item.product?.name || 'Mahsulot'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {item.quantity} × {item.price.toLocaleString('uz-UZ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreOrdersPage;
