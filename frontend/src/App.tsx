import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Distributor Pages
import { DistributorDashboard } from './pages/distributor/DistributorDashboard';
import OrdersPage from './pages/distributor/OrdersPage';
import OrderDetailPage from './pages/distributor/OrderDetailPage';
import { ProductsPage } from './pages/distributor/ProductsPage';
import AddProductPage from './pages/distributor/AddProductPage';
import DriversPage from './pages/distributor/DriversPage';
import ChatPage from './pages/distributor/ChatPage';
import InventoryPage from './pages/distributor/InventoryPage';
import AnalyticsPage from './pages/distributor/AnalyticsPage';
import PricingPage from './pages/distributor/PricingPage';
import SettingsPage from './pages/distributor/SettingsPage';

// Store Owner Pages
import StoreDashboard from './pages/store/StoreDashboard';
import StoreOrdersPage from './pages/store/StoreOrdersPage';
import CatalogPage from './pages/store/CatalogPage';
import DistributorsPage from './pages/store/DistributorsPage';
import FinancePage from './pages/store/FinancePage';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role || '')) return <Navigate to="/" replace />;
  
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Global Home Redirect */}
        <Route 
          path="/" 
          element={
            user?.role === 'DISTRIBUTOR' 
              ? <Navigate to="/distributor/dashboard" /> 
              : user?.role === 'CLIENT' 
                ? <Navigate to="/store/dashboard" /> 
                : <Navigate to="/login" />
          } 
        />

        {/* Distributor Dashboard Routes */}
        <Route path="/distributor" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<Navigate to="/distributor/dashboard" />} />} />
        <Route path="/distributor/dashboard" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<DistributorDashboard />} />} />
        <Route path="/distributor/orders" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<OrdersPage />} />} />
        <Route path="/distributor/orders/:id" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<OrderDetailPage />} />} />
        <Route path="/distributor/products" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<ProductsPage />} />} />
        <Route path="/distributor/products/add" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<AddProductPage />} />} />
        <Route path="/distributor/products/edit/:id" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<AddProductPage />} />} />
        <Route path="/distributor/drivers" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<DriversPage />} />} />
        <Route path="/distributor/inventory" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<InventoryPage />} />} />
        <Route path="/distributor/analytics" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<AnalyticsPage />} />} />
        <Route path="/distributor/pricing" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<PricingPage />} />} />
        <Route path="/distributor/chat" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<ChatPage />} />} />
        <Route path="/distributor/settings" element={<ProtectedRoute roles={['DISTRIBUTOR']} children={<SettingsPage />} />} />

        {/* Store Owner Routes */}
        <Route path="/store/dashboard" element={<ProtectedRoute roles={['CLIENT']} children={<StoreDashboard />} />} />
        <Route path="/store/orders" element={<ProtectedRoute roles={['CLIENT']} children={<StoreOrdersPage />} />} />
        <Route path="/store/catalog" element={<ProtectedRoute roles={['CLIENT']} children={<CatalogPage />} />} />
        <Route path="/store/distributors" element={<ProtectedRoute roles={['CLIENT']} children={<DistributorsPage />} />} />
        <Route path="/store/finance" element={<ProtectedRoute roles={['CLIENT']} children={<FinancePage />} />} />
        <Route path="/store/chat" element={<ProtectedRoute roles={['CLIENT']} children={<ChatPage />} />} />
        <Route path="/store/settings" element={<ProtectedRoute roles={['CLIENT']} children={<SettingsPage />} />} />

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
