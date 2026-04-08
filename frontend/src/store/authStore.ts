import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'ADMIN' | 'DISTRIBUTOR' | 'DRIVER' | 'CLIENT';
  subRole?: 'SUPER_ADMIN' | 'WAREHOUSE_MANAGER' | 'SALES_MANAGER' | 'DRIVER_MANAGER' | null;
  permissions?: any;
  avatar?: string;
  clientId?: string;
  distributorId?: string;
  driverId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  updateToken: (accessToken: string) => void;
  clearAuth: () => void;
  logout: () => void; // alias
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        console.log('🔄 setAuth called:', { user: user.name, role: user.role });
        
        // Save tokens to localStorage for axios interceptor
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        console.log('✅ setAuth completed, isAuthenticated:', true);
      },

      setUser: (user) =>
        set({ user }),

      updateToken: (accessToken) => {
        // Update token in localStorage for axios interceptor
        localStorage.setItem('accessToken', accessToken);
        
        set({ accessToken });
      },

      clearAuth: () => {
        // Clear all localStorage
        localStorage.clear();
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      logout: () => {
        // Clear all localStorage
        localStorage.clear();
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
