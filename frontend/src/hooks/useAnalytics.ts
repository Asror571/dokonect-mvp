import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useDistributorOverview() {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'overview'],
    queryFn: async () => {
      const res = await api.get('/distributor/analytics/dashboard');
      const data = res.data.data;
      return {
        totalOrders: data.orders?.total || 0,
        totalRevenue: data.todaySales?.amount || 0,
        totalProducts: data.topProducts?.length || 0,
        pendingOrders: data.orders?.inProgress || 0,
      };
    },
  });
}

export function useDistributorSales(period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'sales', period],
    queryFn: async () => {
      const res = await api.get(`/distributor/analytics/dashboard`);
      return res.data.data.salesTrend?.map((item: any) => ({
        sana: item.date,
        sotuv: item.sales
      })) || [];
    },
  });
}

export function useDistributorTopProducts(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'top-products', limit],
    queryFn: async () => {
      const res = await api.get(`/distributor/analytics/dashboard`);
      return res.data.data.topProducts?.map((item: any) => ({
        name: item.product?.name || 'Kategoriyasiz',
        value: item.quantity
      })) || [];
    },
  });
}

export function useDistributorTopStores(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'top-stores', limit],
    queryFn: async () => {
      const res = await api.get(`/distributor/analytics/sales`);
      return res.data.data.topClients?.slice(0, limit).map((item: any) => ({
        id: item.client?.id,
        storeName: item.client?.user?.name || item.client?.storeName || 'Noma\'lum',
        orderCount: item.orderCount,
        totalRevenue: item.totalAmount
      })) || [];
    },
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'overview'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/overview');
      return res.data.data;
    },
  });
}

export function useAdminRevenue(period: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/revenue?period=${period}`);
      return res.data.data;
    },
  });
}

export function useAdminOrders(period: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'admin', 'orders', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/orders?period=${period}`);
      return res.data.data;
    },
  });
}
