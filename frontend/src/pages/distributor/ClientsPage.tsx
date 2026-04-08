import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, MapPin, Package, DollarSign, AlertCircle, CheckCircle, XCircle, Search, ChevronRight, Star } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  storeName: string;
  region?: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP';
  totalOrders: number;
  totalSpent: number;
  totalDebt: number;
  lastOrderDate: string;
  joinedAt: string;
  loyaltyPoints: number;
}

const tierConfig = {
  BRONZE: { color: 'bg-amber-700', label: 'Bronza', icon: Star },
  SILVER: { color: 'bg-slate-400', label: 'Kumush', icon: Star },
  GOLD: { color: 'bg-yellow-500', label: 'Oltin', icon: Star },
  VIP: { color: 'bg-purple-500', label: 'VIP', icon: Star },
};

const fetchClients = async () => {
  const response = await api.get('/distributor/clients');
  return response.data.data || [];
};

const fetchPendingClients = async () => {
  const response = await api.get('/distributor/clients/pending');
  return response.data.data || [];
};

const approveClientFn = async (id: string) => {
  const response = await api.post(`/distributor/clients/pending/${id}/approve`);
  return response.data;
};

const rejectClientFn = async (id: string) => {
  const response = await api.post(`/distributor/clients/pending/${id}/reject`);
  return response.data;
};

const ClientsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'debt'>('all');

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['distributor-clients'],
    queryFn: fetchClients,
  });

  const { data: pendingClients = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['distributor-pending-clients'],
    queryFn: fetchPendingClients,
  });

  const { mutate: approveClient, isPending: approving } = useMutation({
    mutationFn: approveClientFn,
    onSuccess: () => {
      toast.success('So\'rov tasdiqlandi');
      queryClient.invalidateQueries({ queryKey: ['distributor-clients'] });
      queryClient.invalidateQueries({ queryKey: ['distributor-pending-clients'] });
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const { mutate: rejectClient, isPending: rejecting } = useMutation({
    mutationFn: rejectClientFn,
    onSuccess: () => {
      toast.success('So\'rov rad etildi');
      queryClient.invalidateQueries({ queryKey: ['distributor-pending-clients'] });
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch =
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery);

    if (activeTab === 'debt') {
      return matchesSearch && client.totalDebt > 0;
    }
    return matchesSearch;
  });

  const clientsWithDebt = clients.filter((c: Client) => c.totalDebt > 0);
  const totalDebt = clientsWithDebt.reduce((sum: number, c: Client) => sum + c.totalDebt, 0);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mijozlar</h1>
          <p className="text-slate-500 text-sm mt-1">
            {clients.length} ta do'kon ulangan • {clientsWithDebt.length} ta nasiyador
          </p>
        </div>
        <div className="flex gap-2">
          {totalDebt > 0 && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-600 font-semibold">
                Umumiy nasiya: {totalDebt.toLocaleString()} UZS
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              <p className="text-xs text-slate-500">Jami mijozlar</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.reduce((sum: number, c: Client) => sum + c.totalOrders, 0)}
              </p>
              <p className="text-xs text-slate-500">Jami buyurtmalar</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.reduce((sum: number, c: Client) => sum + c.totalSpent, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Jami savdo (UZS)</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clientsWithDebt.length}</p>
              <p className="text-xs text-slate-500">Nasiyador mijozlar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Barcha mijozlar', count: clients.length },
              { id: 'pending', label: 'So\'rovlar', count: pendingClients.length },
              { id: 'debt', label: 'Nasiyadorlar', count: clientsWithDebt.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-violet-100' : 'bg-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'pending' ? (
            /* Pending Requests */
            <div className="space-y-3">
              {pendingLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : pendingClients.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Kutilayotgan so'rovlar yo'q</p>
                </div>
              ) : (
                pendingClients.map((client: any) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-lg">
                        {client.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        <p className="text-sm text-slate-500">{client.storeName || 'Do\'kon'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </span>
                          {client.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {client.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveClient(client.id)}
                        disabled={approving}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => rejectClient(client.id)}
                        disabled={rejecting}
                        className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Rad etish
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Clients List */
            <div className="grid gap-3">
              {(activeTab === 'all' ? filteredClients : clientsWithDebt).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Mijozlar topilmadi</p>
                </div>
              ) : (
                (activeTab === 'all' ? filteredClients : clientsWithDebt).map((client: Client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/distributor/clients/${client.id}`)}
                    className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-violet-200 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 flex items-center justify-center font-bold text-lg">
                        {client.storeName?.charAt(0) || client.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{client.storeName || client.name}</p>
                          <Badge variant={client.tier === 'VIP' ? 'primary' : client.tier === 'GOLD' ? 'warning' : 'secondary'}>
                            {tierConfig[client.tier].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {client.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> {client.totalOrders} ta buyurtma
                          </span>
                          {client.lastOrderDate && (
                            <span className="text-slate-400">
                              Oxirgi: {new Date(client.lastOrderDate).toLocaleDateString('uz-UZ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{client.totalSpent.toLocaleString()} UZS</p>
                        <p className="text-xs text-slate-500">Jami savdo</p>
                      </div>
                      {client.totalDebt > 0 && (
                        <div className="text-right px-4 py-2 bg-red-50 rounded-xl">
                          <p className="font-semibold text-red-600">{client.totalDebt.toLocaleString()} UZS</p>
                          <p className="text-xs text-red-500">Nasiya</p>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
