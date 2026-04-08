import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import GlobalDashboard from '../pages/admin/GlobalDashboard';
import { OrdersPage as AdminOrdersPage } from '../pages/admin/OrdersPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { DistributorDashboard } from '../pages/distributor/DistributorDashboard';
import { ProductsPage as DistributorProductsPage } from '../pages/distributor/ProductsPage';
import { AddProductPage } from '../pages/distributor/AddProductPage';
import { AnalyticsPage } from '../pages/distributor/AnalyticsPage';
import { OrdersPage as DistributorOrdersPage } from '../pages/distributor/OrdersPage';
import { ChatPage as DistributorChatPage } from '../pages/distributor/ChatPage';
import ClientsPage from '../pages/distributor/ClientsPage';
import ClientDetailPage from '../pages/distributor/ClientDetailPage';
import { DriverDashboard } from '../pages/driver/DriverDashboard';
import { DriverHomePage } from '../pages/driver/DriverHomePage';
import { ActiveDeliveryPage } from '../pages/driver/ActiveDeliveryPage';
import { DriverEarningsPage } from '../pages/driver/DriverEarningsPage';
import { ClientDashboard } from '../pages/client/ClientDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'dashboard', element: <GlobalDashboard /> },
      { path: 'old-dashboard', element: <AdminDashboard /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
  {
    path: '/distributor',
    children: [
      { path: 'dashboard', element: <DistributorDashboard /> },
      { path: 'products', element: <DistributorProductsPage /> },
      { path: 'products/add', element: <AddProductPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'orders', element: <DistributorOrdersPage /> },
      { path: 'orders/:id', element: <div>Order Detail (to be implemented)</div> },
      { path: 'chat', element: <DistributorChatPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
    ],
  },
  {
    path: '/driver',
    children: [
      { index: true, element: <DriverHomePage /> },
      { path: 'dashboard', element: <DriverDashboard /> },
      { path: 'home', element: <DriverHomePage /> },
      { path: 'delivery/:orderId', element: <ActiveDeliveryPage /> },
      { path: 'earnings', element: <DriverEarningsPage /> },
    ],
  },
  {
    path: '/client',
    children: [
      { path: 'dashboard', element: <ClientDashboard /> },
    ],
  },
]);
