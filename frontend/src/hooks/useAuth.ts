import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  // Initialize loading state on mount
  useEffect(() => {
    // If we have token and user in storage, we're authenticated
    // Axios interceptor will handle token refresh if needed
    if (accessToken && user) {
      // Already authenticated from storage
      setLoading(false);
    } else if (accessToken && !user) {
      // Have token but no user - this shouldn't happen, clear auth
      clearAuth();
      setLoading(false);
    } else {
      // No token, not authenticated
      setLoading(false);
    }
  }, []); // Empty deps - run only once on mount

  const login = async (phone: string, password: string, rememberMe: boolean = false) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        phone,
        password,
        rememberMe,
      });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        setAuth(user, accessToken, refreshToken);
        return { success: true, user };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  const register = async (data: any) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/register', data);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };
};
