import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import CatalogPage from '../pages/store/CatalogPage';
import CartPage from '../pages/store/CartPage';
import StoreOrdersPage from '../pages/store/OrdersPage';
import StoreChatPage from '../pages/store/ChatPage';
import ProductsPage from '../pages/distributor/ProductsPage';
import AddProductPage from '../pages/distributor/AddProductPage';
import DistributorOrdersPage from '../pages/distributor/OrdersPage';
import DistributorChatPage from '../pages/distributor/ChatPage';
import AnalyticsPage from '../pages/distributor/AnalyticsPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminOrders from '../pages/admin/AdminOrders';
import ProfilePage from '../pages/ProfilePage';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/auth.store';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'STORE_OWNER' | 'DISTRIBUTOR' | 'ADMIN' }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const defaultPath = user.role === 'STORE_OWNER' ? '/catalog' : user.role === 'DISTRIBUTOR' ? '/distributor/products' : '/admin';
    return <Navigate to={defaultPath} replace />;
  }
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuthStore();
  if (token && user) {
    const defaultPath = user.role === 'STORE_OWNER' ? '/catalog' : user.role === 'DISTRIBUTOR' ? '/distributor/products' : '/admin';
    return <Navigate to={defaultPath} replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      // STORE_OWNER routes
      { path: 'catalog', element: <ProtectedRoute role="STORE_OWNER"><CatalogPage /></ProtectedRoute> },
      { path: 'cart', element: <ProtectedRoute role="STORE_OWNER"><CartPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute role="STORE_OWNER"><StoreOrdersPage /></ProtectedRoute> },
      { path: 'chat', element: <ProtectedRoute role="STORE_OWNER"><StoreChatPage /></ProtectedRoute> },
      // DISTRIBUTOR routes
      { path: 'distributor/products', element: <ProtectedRoute role="DISTRIBUTOR"><ProductsPage /></ProtectedRoute> },
      { path: 'distributor/products/add', element: <ProtectedRoute role="DISTRIBUTOR"><AddProductPage /></ProtectedRoute> },
      { path: 'distributor/orders', element: <ProtectedRoute role="DISTRIBUTOR"><DistributorOrdersPage /></ProtectedRoute> },
      { path: 'distributor/chat', element: <ProtectedRoute role="DISTRIBUTOR"><DistributorChatPage /></ProtectedRoute> },
      { path: 'distributor/analytics', element: <ProtectedRoute role="DISTRIBUTOR"><AnalyticsPage /></ProtectedRoute> },
      // ADMIN routes
      { path: 'admin', element: <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute> },
      { path: 'admin/users', element: <ProtectedRoute role="ADMIN"><AdminUsers /></ProtectedRoute> },
      { path: 'admin/products', element: <ProtectedRoute role="ADMIN"><AdminProducts /></ProtectedRoute> },
      { path: 'admin/orders', element: <ProtectedRoute role="ADMIN"><AdminOrders /></ProtectedRoute> },
      // Shared
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/login', element: <AuthRoute><LoginPage /></AuthRoute> },
  { path: '/register', element: <AuthRoute><RegisterPage /></AuthRoute> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function RoleRedirect() {
  const { user } = useAuthStore();
  const defaultPath = user?.role === 'STORE_OWNER' ? '/catalog' : user?.role === 'DISTRIBUTOR' ? '/distributor/products' : '/admin';
  return <Navigate to={defaultPath} replace />;
}
