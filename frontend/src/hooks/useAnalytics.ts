import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

export function useDistributorOverview() {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/distributor/overview');
      return res.data.data;
    },
  });
}

export function useDistributorSales(period: string = '7d') {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'sales', period],
    queryFn: async () => {
      const res = await api.get(`/analytics/distributor/sales?period=${period}`);
      return res.data.data;
    },
  });
}

export function useDistributorTopProducts(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'top-products', limit],
    queryFn: async () => {
      const res = await api.get(`/analytics/distributor/top-products?limit=${limit}`);
      return res.data.data;
    },
  });
}

export function useDistributorTopStores(limit = 5) {
  return useQuery({
    queryKey: ['analytics', 'distributor', 'top-stores', limit],
    queryFn: async () => {
      const res = await api.get(`/analytics/distributor/top-stores?limit=${limit}`);
      return res.data.data;
    },
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ['analytics', 'admin', 'overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/admin/overview');
      return res.data.data;
    },
  });
}

export function useAdminRevenue(period: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue', period],
    queryFn: async () => {
      const res = await api.get(`/analytics/admin/revenue?period=${period}`);
      return res.data.data;
    },
  });
}

export function useAdminOrders(period: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'admin', 'orders', period],
    queryFn: async () => {
      const res = await api.get(`/analytics/admin/orders?period=${period}`);
      return res.data.data;
    },
  });
}
