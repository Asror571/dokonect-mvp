import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { ArrowLeft, Phone, MapPin, Package, DollarSign, MessageSquare, User, Star, Calendar, ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import toast from 'react-hot-toast';

const fetchClientDetail = async (id: string) => {
  const response = await api.get(`/distributor/clients/${id}`);
  return response.data.data;
};

const fetchClientOrders = async (id: string) => {
  const response = await api.get(`/distributor/clients/${id}/orders`);
  return response.data.data;
};

const fetchClientDebts = async (id: string) => {
  const response = await api.get(`/distributor/clients/${id}/debts`);
  return response.data.data;
};

const recordPaymentFn = async ({ debtId, amount }: { debtId: string; amount: number }) => {
  const response = await api.post(`/debts/${debtId}/payment`, { amount });
  return response.data;
};

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'debts'>('overview');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client-detail', id],
    queryFn: () => fetchClientDetail(id!),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['client-orders', id],
    queryFn: () => fetchClientOrders(id!),
    enabled: !!id && activeTab === 'orders',
  });

  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ['client-debts', id],
    queryFn: () => fetchClientDebts(id!),
    enabled: !!id && activeTab === 'debts',
  });

  const { mutate: recordPayment, isPending: recording } = useMutation({
    mutationFn: recordPaymentFn,
    onSuccess: () => {
      toast.success('To\'lov qayd etildi');
      setPaymentAmount('');
      setSelectedDebtId(null);
      queryClient.invalidateQueries({ queryKey: ['client-debts', id] });
      queryClient.invalidateQueries({ queryKey: ['client-detail', id] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Mijoz topilmadi</p>
        <button
          onClick={() => navigate('/distributor/clients')}
          className="mt-4 text-violet-600 hover:underline"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const tierColors = {
    BRONZE: 'bg-amber-700',
    SILVER: 'bg-slate-400',
    GOLD: 'bg-yellow-500',
    VIP: 'bg-purple-500',
  };

  const tierLabels = {
    BRONZE: 'Bronza',
    SILVER: 'Kumush',
    GOLD: 'Oltin',
    VIP: 'VIP',
  };

  return (
    <div className="fade-in space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/distributor/clients')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Orqaga</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 flex items-center justify-center text-3xl font-bold">
              {client.storeName?.charAt(0) || client.user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{client.storeName || client.user?.name}</h1>
                <Badge className={`${tierColors[client.tier]} text-white`}>
                  {tierLabels[client.tier]}
                </Badge>
              </div>
              <p className="text-slate-500 mt-1">{client.user?.name}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {client.user?.phone}
                </span>
                {client.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {client.region}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Qo'shilgan: {new Date(client.joinedAt || client.user?.createdAt).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/distributor/chat`)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" /> Xabar
            </button>
            <button
              onClick={() => navigate(`/distributor/orders/create?clientId=${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
            >
              <ShoppingCart className="w-4 h-4" /> Buyurtma
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-slate-900">{client.stats?.totalOrders || 0}</p>
            <p className="text-sm text-slate-500">Jami buyurtmalar</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{(client.stats?.totalSpent || 0).toLocaleString()} UZS</p>
            <p className="text-sm text-slate-500">Jami savdo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{(client.stats?.averageOrderValue || 0).toLocaleString()} UZS</p>
            <p className="text-sm text-slate-500">O'rtacha buyurtma</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${(client.debt?.totalDebt || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {(client.debt?.totalDebt || 0).toLocaleString()} UZS
            </p>
            <p className="text-sm text-slate-500">Nasiya</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Umumiy', icon: User },
          { id: 'orders', label: 'Buyurtmalar', icon: Package },
          { id: 'debts', label: 'Nasiya', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Orders */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">So'nggi buyurtmalar</h3>
              {client.orders?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Buyurtmalar yo'q</p>
              ) : (
                <div className="space-y-3">
                  {client.orders?.slice(0, 5).map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/distributor/orders/${order.id}`)}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: uz })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{order.totalAmount.toLocaleString()} UZS</p>
                        <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Products */}
            {client.favoriteProducts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Eng ko'p sotib olingan mahsulotlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.favoriteProducts.map((item: any) => (
                    <div key={item.product.id} className="p-4 border border-slate-100 rounded-xl">
                      <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.quantity} dona sotilgan</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="text-center py-12">Yuklanmoqda...</div>
            ) : ordersData?.orders?.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersData?.orders?.map((order: any) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/distributor/orders/${order.id}`)}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: uz })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{order.items?.length} mahsulot</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{order.totalAmount.toLocaleString()} UZS</p>
                      <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-6">
            {/* Debt Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-slate-900">{(client.debt?.totalDebt || 0).toLocaleString()} UZS</p>
                <p className="text-sm text-slate-500">Jami nasiya</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{(client.debt?.overdueDebt || 0).toLocaleString()} UZS</p>
                <p className="text-sm text-red-500">Muddati o'tgan</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{client.debt?.activeDebts || 0}</p>
                <p className="text-sm text-amber-500">Faol nasiyalar</p>
              </div>
            </div>

            {/* Debt List */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Nasiyalar ro'yxati</h3>
              {debtsLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : debts?.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nasiyalar yo'q</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {debts?.map((debt: any) => (
                    <div key={debt.id} className="p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium text-slate-900">Buyurtma #{debt.order?.id?.slice(0, 8)}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(debt.createdAt), 'dd MMM yyyy', { locale: uz })}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={debt.status === 'PAID' ? 'success' : debt.isOverdue ? 'danger' : 'warning'}>
                            {debt.status === 'PAID' ? 'To\'langan' : debt.isOverdue ? 'Muddati o\'tgan' : 'To\'lanmagan'}
                          </Badge>
                          {debt.isOverdue && (
                            <p className="text-xs text-red-500 mt-1">{debt.daysOverdue} kun o'tdi</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-slate-500">Asl summa</p>
                          <p className="font-medium">{debt.originalAmount.toLocaleString()} UZS</p>
                        </div>
                        <div>
                          <p className="text-slate-500">To'langan</p>
                          <p className="font-medium text-emerald-600">{debt.paidAmount.toLocaleString()} UZS</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Qoldiq</p>
                          <p className="font-medium text-red-600">{debt.remainingAmount.toLocaleString()} UZS</p>
                        </div>
                      </div>

                      {/* Payment Form */}
                      {debt.status !== 'PAID' && (
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <input
                            type="number"
                            placeholder="Summa"
                            value={selectedDebtId === debt.id ? paymentAmount : ''}
                            onChange={(e) => {
                              setSelectedDebtId(debt.id);
                              setPaymentAmount(e.target.value);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => {
                              if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
                                toast.error('Summani kiriting');
                                return;
                              }
                              recordPayment({ debtId: debt.id, amount: parseFloat(paymentAmount) });
                            }}
                            disabled={recording || selectedDebtId !== debt.id}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                          >
                            To'lov qilish
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
