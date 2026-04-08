import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp, MapPin } from 'lucide-react';
import { DriverStatusToggle } from '../../components/driver/DriverStatusToggle';
import { OrderAcceptCard } from '../../components/driver/OrderAcceptCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const DriverHomePage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['driver-home'],
    queryFn: () => api.get('/driver/dashboard').then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (online: boolean) =>
      api.patch('/driver/status', { isOnline: online }),
    onSuccess: (_, online) => {
      setIsOnline(online);
      toast.success(online ? 'You are now online' : 'You are now offline');
      queryClient.invalidateQueries({ queryKey: ['driver-home'] });
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/driver/orders/${orderId}/accept`),
    onSuccess: () => {
      toast.success('Order accepted!');
      setIncomingOrder(null);
      queryClient.invalidateQueries({ queryKey: ['driver-home'] });
    },
  });

  const handleStatusChange = (online: boolean) => {
    updateStatusMutation.mutate(online);
  };

  const handleAcceptOrder = () => {
    if (incomingOrder) {
      acceptOrderMutation.mutate(incomingOrder.id);
    }
  };

  const handleDeclineOrder = () => {
    setIncomingOrder(null);
    toast('Order declined');
  };

  // Listen for incoming orders via socket
  React.useEffect(() => {
    const handleOrderOffer = (event: any) => {
      setIncomingOrder(event.detail.order);
    };

    window.addEventListener('order-offer', handleOrderOffer);
    return () => window.removeEventListener('order-offer', handleOrderOffer);
  }, []);

  const todayEarnings = dashboard?.todayEarnings || 0;
  const todayOrders = dashboard?.todayOrders || 0;
  const dailyGoal = 500000; // 500k UZS
  const goalProgress = (todayEarnings / dailyGoal) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-slate-400">{dashboard?.driver?.user.name}</p>
      </div>

      {/* Status Toggle */}
      <div className="mb-6">
        <DriverStatusToggle
          isOnline={isOnline}
          onChange={handleStatusChange}
          disabled={updateStatusMutation.isPending}
        />
      </div>

      {/* Incoming Order */}
      {incomingOrder && (
        <div className="mb-6">
          <OrderAcceptCard
            order={incomingOrder}
            expiresIn={30}
            onAccept={handleAcceptOrder}
            onDecline={handleDeclineOrder}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <Package className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Today</p>
              <p className="text-2xl font-bold">{todayOrders}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Completed orders</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Earnings</p>
              <p className="text-2xl font-bold">{todayEarnings.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">UZS today</p>
        </motion.div>
      </div>

      {/* Daily Goal */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Daily Goal</span>
          </div>
          <span className="text-sm text-slate-400">
            {todayEarnings.toLocaleString()} / {dailyGoal.toLocaleString()} UZS
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(goalProgress, 100)}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {goalProgress >= 100 ? '🎉 Goal achieved!' : `${(100 - goalProgress).toFixed(0)}% to go`}
        </p>
      </div>

      {/* Active Order */}
      {dashboard?.activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Active Delivery</h3>
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              In Progress
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-sky-100 text-sm">Delivery to</p>
                <p className="font-semibold">{dashboard.activeOrder.client.user.name}</p>
                <p className="text-sm">{dashboard.activeOrder.deliveryAddress.street}</p>
              </div>
            </div>
          </div>

          <button className="w-full bg-white text-sky-600 py-3 rounded-xl font-bold hover:bg-sky-50 transition-colors">
            Continue Delivery →
          </button>
        </motion.div>
      )}

      {/* No Active Order */}
      {!dashboard?.activeOrder && isOnline && !incomingOrder && (
        <div className="bg-slate-800 rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Waiting for orders...</p>
          <p className="text-slate-500 text-sm mt-2">You'll be notified when a new order arrives</p>
        </div>
      )}
    </div>
  );
};
