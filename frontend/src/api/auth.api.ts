import api from './api';

export const loginFn = async (data: any) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const registerFn = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const fetchProfileFn = async () => {
  const response = await api.get('/profile');
  return response.data;
};
