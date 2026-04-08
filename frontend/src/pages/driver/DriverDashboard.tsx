import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Package, Navigation } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const DriverDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);

  const { data: dashboard, refetch } = useQuery({
    queryKey: ['driver-dashboard'],
    queryFn: () => api.get('/driver/dashboard').then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (online: boolean) =>
      api.patch('/driver/status', { isOnline: online }),
    onSuccess: () => {
      refetch();
      toast.success(isOnline ? 'You are now online' : 'You are now offline');
    },
  });

  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  // Track location every 5 seconds when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          api.post('/driver/location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error)
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const activeOrder = dashboard?.activeOrder;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              {dashboard?.driver?.user.name}
            </p>
          </div>

          {/* Online/Offline Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleOnline}
            className={`relative w-20 h-10 rounded-full transition-colors ${
              isOnline ? 'bg-green-500' : 'bg-slate-600'
            }`}
          >
            <motion.div
              animate={{ x: isOnline ? 40 : 0 }}
              className="absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-lg"
            />
          </motion.button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <Package className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Today</p>
                <p className="text-2xl font-bold">{dashboard?.todayOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Earnings</p>
                <p className="text-2xl font-bold">
                  {(dashboard?.todayEarnings || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Order */}
        {activeOrder ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Active Delivery</h2>
              <StatusBadge status={activeOrder.status} size="md" />
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sky-100 text-sm">Customer</p>
                <p className="text-lg font-semibold">{activeOrder.client.user.name}</p>
              </div>

              <div>
                <p className="text-sky-100 text-sm">Delivery Address</p>
                <p className="font-medium">{activeOrder.deliveryAddress.street}</p>
              </div>

              <div>
                <p className="text-sky-100 text-sm">Items</p>
                {activeOrder.items.slice(0, 2).map((item: any, idx: number) => (
                  <p key={idx} className="text-sm">
                    {item.quantity}x {item.product.name}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-white text-sky-600 py-3 rounded-xl font-bold hover:bg-sky-50 transition-colors flex items-center justify-center gap-2">
                <Navigation className="w-5 h-5" />
                Navigate
              </button>
              <button className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors">
                Mark Delivered
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {isOnline ? 'Waiting for orders...' : 'Go online to receive orders'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
