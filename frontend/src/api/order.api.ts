import api from './api';

// Store Owner Orders
export const createOrderFn = async (orderData: any) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const fetchMyOrdersFn = async () => {
  const response = await api.get('/orders');
  return response.data;
};

// Distributor Orders
export const fetchDistributorOrdersFn = async () => {
  const response = await api.get('/distributor/orders');
  return response.data;
};

export const updateOrderStatusFn = async ({ id, status }: { id: string; status: string }) => {
  const response = await api.patch(`/distributor/orders/${id}/status`, { status });
  return response.data;
};
