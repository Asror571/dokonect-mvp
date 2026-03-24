import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import CatalogPage from '../pages/store/CatalogPage';
import CartPage from '../pages/store/CartPage';
import StoreOrdersPage from '../pages/store/OrdersPage';
import ProductsPage from '../pages/distributor/ProductsPage';
import AddProductPage from '../pages/distributor/AddProductPage';
import DistributorOrdersPage from '../pages/distributor/OrdersPage';
import ProfilePage from '../pages/ProfilePage';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/auth.store';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'STORE_OWNER' | 'DISTRIBUTOR' }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'STORE_OWNER' ? '/catalog' : '/distributor/products'} replace />;
  }
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuthStore();
  if (token && user) {
    return <Navigate to={user.role === 'STORE_OWNER' ? '/catalog' : '/distributor/products'} replace />;
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
      // DISTRIBUTOR routes
      { path: 'distributor/products', element: <ProtectedRoute role="DISTRIBUTOR"><ProductsPage /></ProtectedRoute> },
      { path: 'distributor/products/add', element: <ProtectedRoute role="DISTRIBUTOR"><AddProductPage /></ProtectedRoute> },
      { path: 'distributor/orders', element: <ProtectedRoute role="DISTRIBUTOR"><DistributorOrdersPage /></ProtectedRoute> },
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
  return <Navigate to={user?.role === 'STORE_OWNER' ? '/catalog' : '/distributor/products'} replace />;
}
