import React from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Clock, ShoppingBag } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Timeline } from '../../components/ui/Timeline';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => api.get('/client/dashboard').then(res => res.data),
  });

  const activeOrder = dashboard?.activeOrder;
  const recentOrders = dashboard?.recentOrders || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage your deliveries</p>
      </div>

      <div className="p-8">
        {/* Active Order Tracking */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Active Order</h2>
              <StatusBadge status={activeOrder.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-mono font-medium">#{activeOrder.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Delivery Address</p>
                      <p className="font-medium">{activeOrder.deliveryAddress.street}</p>
                    </div>
                  </div>

                  {activeOrder.driver && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                        {activeOrder.driver.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-medium">{activeOrder.driver.user.name}</p>
                        <button className="text-sm text-sky-600 hover:text-sky-700">
                          Call Driver
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
                <Timeline
                  items={activeOrder.statusHistory || []}
                  currentStatus={activeOrder.status}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/client/catalog')}
            className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <ShoppingBag className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-1">Browse Products</h3>
            <p className="text-sky-100">Explore our catalog and place new orders</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/client/orders')}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <Clock className="w-8 h-8 text-gray-600 mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">Order History</h3>
            <p className="text-gray-600">View all your past orders</p>
          </motion.button>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h2>

          <div className="space-y-4">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <Package className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-gray-600">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} items • {order.totalAmount.toLocaleString()} UZS
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
