import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import StoreNavbar from './StoreNavbar';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';

const MainLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (location.pathname === '/') {
    const defaultPath = user?.role === 'STORE_OWNER' ? '/catalog' : user?.role === 'DISTRIBUTOR' ? '/distributor/products' : '/admin';
    return <Navigate to={defaultPath} />;
  }

  if (user?.role === 'ADMIN') {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  if (user?.role === 'DISTRIBUTOR') {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <StoreNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
