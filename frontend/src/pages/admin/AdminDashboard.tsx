import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  DollarSign,
  Truck,
  Clock,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { OrderCard } from '../../components/ui/OrderCard';
import { DriverCard } from '../../components/ui/DriverCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then(res => res.data),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/admin/orders/recent').then(res => res.data),
  });

  const { data: activeDrivers } = useQuery({
    queryKey: ['active-drivers'],
    queryFn: () => api.get('/admin/drivers/active').then(res => res.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={Package}
            trend={stats?.ordersTrend}
            trendLabel="vs yesterday"
            color="primary"
          />
          <KPICard
            title="Revenue"
            value={`${(stats?.revenue || 0).toLocaleString()} UZS`}
            icon={DollarSign}
            trend={stats?.revenueTrend}
            trendLabel="vs yesterday"
            color="success"
          />
          <KPICard
            title="Active Drivers"
            value={stats?.activeDrivers || 0}
            icon={Truck}
            color="warning"
          />
          <KPICard
            title="Pending Deliveries"
            value={stats?.pendingDeliveries || 0}
            icon={Clock}
            color="danger"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <button className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentOrders?.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="expanded"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active Drivers */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Active Drivers</h2>
                <span className="text-sm text-gray-600">
                  {activeDrivers?.length || 0} online
                </span>
              </div>

              <div className="space-y-4">
                {activeDrivers?.map((driver: any) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Map Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Driver Locations</h2>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Map integration coming soon</p>
              <p className="text-sm text-gray-500">Mapbox GL JS / Google Maps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
