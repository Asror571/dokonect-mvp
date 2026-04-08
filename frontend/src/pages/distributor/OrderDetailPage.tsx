import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, XCircle, Truck, DollarSign, MessageSquare, User, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'NEW',        label: 'Yangi',          variant: 'warning',  icon: Clock },
  { value: 'ACCEPTED',   label: 'Qabul qilindi',  variant: 'primary',  icon: CheckCircle },
  { value: 'REJECTED',   label: 'Rad etildi',     variant: 'danger',   icon: XCircle },
  { value: 'ASSIGNED',   label: 'Assign qilindi', variant: 'info',     icon: User },
  { value: 'IN_TRANSIT', label: "Yo'lda",         variant: 'info',     icon: Truck },
  { value: 'DELIVERED',  label: 'Yetkazildi',     variant: 'success',  icon: CheckCircle },
  { value: 'CANCELLED',  label: 'Bekor qilindi',  variant: 'danger',   icon: XCircle },
  { value: 'PAID',       label: "To'landi",       variant: 'success',  icon: DollarSign },
];

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: resp, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await api.get(`/distributor/orders/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: driversResp } = useQuery({
    queryKey: ['distributor-drivers'],
    queryFn: async () => {
      const res = await api.get('/distributor/drivers');
      return res.data;
    },
  });

  const { mutate: acceptOrder, isPending: accepting } = useMutation({
    mutationFn: () => api.post(`/distributor/orders/${id}/accept`),
    onSuccess: () => { toast.success('Buyurtma qabul qilindi'); queryClient.invalidateQueries({ queryKey: ['order-detail', id] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const { mutate: rejectOrder, isPending: rejecting } = useMutation({
    mutationFn: () => api.post(`/distributor/orders/${id}/reject`, { reason: 'Rad etildi' }),
    onSuccess: () => { toast.success('Buyurtma rad etildi'); queryClient.invalidateQueries({ queryKey: ['order-detail', id] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const { mutate: assignDriver } = useMutation({
    mutationFn: (driverId: string) => api.post(`/distributor/orders/${id}/assign`, { driverId }),
    onSuccess: () => { toast.success('Haydovchi belgilandi'); queryClient.invalidateQueries({ queryKey: ['order-detail', id] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const order = resp?.data;
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <XCircle className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500">Buyurtma topilmadi</p>
        <button onClick={() => navigate('/distributor/orders')} className="text-violet-500 text-sm hover:underline">Orqaga qaytish</button>
      </div>
    );
  }

  const statusInfo = statusOptions.find(s => s.value === order.status);
  const drivers = driversResp?.data || [];

  return (
    <div className="fade-in space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/distributor/orders')} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Buyurtma #{order.id?.slice(-8).toUpperCase()}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: uz })}</p>
        </div>
        <Badge variant={statusInfo?.variant as any}>{statusInfo?.label || order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – Order items + Total */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-900">Mahsulotlar</h2>
              <span className="ml-auto text-xs text-slate-400">{order.items?.length || 0} ta</span>
            </div>
            <div className="divide-y divide-slate-50">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.product?.name || 'Mahsulot'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.quantity} × {(item.price || 0).toLocaleString()} UZS</p>
                  </div>
                  <p className="text-sm font-bold text-violet-600 shrink-0">{((item.quantity || 0) * (item.price || 0)).toLocaleString()} UZS</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Jami mahsulotlar</span>
                <span>{(order.totalAmount || 0).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Yetkazish</span>
                <span>{(order.deliveryCost || 0).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Umumiy</span>
                <span className="text-violet-600">{((order.totalAmount || 0) + (order.deliveryCost || 0)).toLocaleString()} UZS</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Status tarixi</h2>
              <div className="space-y-3">
                {order.statusHistory.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">{log.status}</span>
                      {log.note && <span className="text-xs text-slate-400 ml-2">— {log.note}</span>}
                    </div>
                    <span className="text-xs text-slate-400">{format(new Date(log.createdAt), "dd MMM HH:mm", { locale: uz })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column – Info + Actions */}
        <div className="space-y-5">
          {/* Store info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Do'kon ma'lumotlari</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  {order.client?.storeName?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{order.client?.storeName}</p>
                  <p className="text-xs text-slate-400">{order.client?.user?.name}</p>
                </div>
              </div>
              {order.client?.user?.phone && (
                <a href={`tel:${order.client.user.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.client.user.phone}
                </a>
              )}
              {order.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  <p className="text-sm text-slate-600">{order.address}</p>
                </div>
              )}
            </div>
            {/* Chat link */}
            <button
              onClick={() => navigate('/distributor/chat')}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Xabar yuborish
            </button>
          </div>

          {/* Actions */}
          {order.status === 'NEW' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Amallar</h2>
              <div className="space-y-2">
                <button
                  onClick={() => acceptOrder()}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
                >
                  {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Qabul qilish
                </button>
                <button
                  onClick={() => rejectOrder()}
                  disabled={rejecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Rad etish
                </button>
              </div>
            </div>
          )}

          {/* Assign Driver */}
          {(order.status === 'ACCEPTED' || order.status === 'ASSIGNED') && drivers.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Haydovchi belgilash</h2>
              {order.driver ? (
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                  <Truck className="w-4 h-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{order.driver.user?.name}</p>
                    <p className="text-xs text-slate-400">{order.driver.vehicleType} · {order.driver.plateNumber}</p>
                  </div>
                </div>
              ) : null}
              <select
                defaultValue=""
                onChange={(e) => { if (e.target.value) assignDriver(e.target.value); }}
                className="w-full mt-3 appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="">Haydovchi tanlang</option>
                {drivers.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.user?.name || d.name} — {d.vehicleType}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
