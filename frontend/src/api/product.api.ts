import api from './api';

export interface ProductsQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const fetchProductsFn = async (params: ProductsQuery = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const fetchCategoriesFn = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};

export const fetchProductByIdFn = async (id: string) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Distributor Only
export const fetchDistributorProductsFn = async () => {
  const response = await api.get('/distributor/products');
  return response.data;
};

export const createProductFn = async (formData: FormData) => {
  const response = await api.post('/distributor/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProductFn = async ({ id, formData }: { id: string; formData: FormData }) => {
  const response = await api.put(`/distributor/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProductFn = async (id: string) => {
  const response = await api.delete(`/distributor/products/${id}`);
  return response.data;
};

export const updateProductStockFn = async ({ id, stock }: { id: string; stock: number }) => {
  const response = await api.patch(`/distributor/products/${id}/stock`, { stock });
  return response.data;
};
