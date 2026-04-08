import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Search, Filter, ClipboardList, Package, Truck, Clock } from 'lucide-react';
import { Input } from '../../components/ui/Input';

const StoreOrdersPage = () => {
  const navigate = useNavigate();

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['store-orders'],
    queryFn: async () => {
      const response = await api.get('/client/orders');
      return response.data;
    },
    staleTime: 30000,
  });

  const orders = ordersResponse?.data?.orders || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return Clock;
      case 'ACCEPTED': return Package;
      case 'IN_TRANSIT': return Truck;
      case 'DELIVERED': return ClipboardList;
      default: return ClipboardList;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'warning';
      case 'ACCEPTED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'IN_TRANSIT': return 'info';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 underline decoration-indigo-500 underline-offset-8">Mening Buyurtmalarim</h1>
          <p className="text-slate-500 text-sm mt-1">Barcha buyurtmalarni kuzating va boshqaring.</p>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-medium text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order: any) => {
          const StatusIcon = getStatusIcon(order.status);
          return (
            <div 
              key={order.id} 
              onClick={() => navigate(`/store/orders/${order.id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${getStatusColor(order.status)}-50 text-${getStatusColor(order.status)}-600 group-hover:scale-110 transition-transform`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-indigo-500 font-medium">#{order.id.slice(0, 8)}</p>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{order.distributor?.companyName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(order.createdAt), "dd MMMM, yyyy HH:mm", { locale: uz })}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 pr-4">
                  <p className="text-lg font-bold text-slate-900 uppercase">{(order.totalAmount || 0).toLocaleString()} UZS</p>
                  <Badge variant={getStatusColor(order.status) as any}>{order.status}</Badge>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="flex items-center justify-center p-12 text-slate-400">
            Hali buyurtmalar yo'q
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOrdersPage;
