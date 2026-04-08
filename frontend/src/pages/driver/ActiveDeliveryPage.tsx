import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Camera, AlertTriangle, Navigation } from 'lucide-react';
import { DeliveryStepBar } from '../../components/driver/DeliveryStepBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ActiveDeliveryPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProblemModal, setShowProblemModal] = useState(false);

  const { data: order } = useQuery({
    queryKey: ['active-delivery', orderId],
    queryFn: () => api.get(`/driver/orders/${orderId}`).then(res => res.data),
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/driver/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-delivery', orderId] });
      toast.success('Status updated');
    },
  });

  const handleStepChange = (step: string) => {
    updateStatusMutation.mutate(step);
    
    if (step === 'DELIVERED') {
      toast.success('Delivery completed! 🎉');
      setTimeout(() => navigate('/driver'), 2000);
    }
  };

  const handleCallClient = () => {
    if (order?.client?.user?.phone) {
      window.location.href = `tel:${order.client.user.phone}`;
    }
  };

  const handleNavigate = () => {
    const address = order?.deliveryAddress?.street || '';
    // Open in Google Maps or Yandex Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Map Placeholder */}
      <div className="h-64 bg-slate-800 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500">Map integration coming soon</p>
          </div>
        </div>
        
        {/* Navigate Button */}
        <button
          onClick={handleNavigate}
          className="absolute bottom-4 right-4 bg-sky-500 text-white p-4 rounded-full shadow-lg hover:bg-sky-600 transition-colors"
        >
          <Navigation className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {/* Customer Info */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Delivering to</p>
              <p className="text-xl font-bold">{order.client.user.name}</p>
            </div>
            <button
              onClick={handleCallClient}
              className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-slate-300">{order.deliveryAddress.street}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-slate-400 text-sm mb-3">Items to deliver</p>
          <div className="space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-300">
                  {item.quantity}x {item.product.name}
                </span>
                <span className="text-slate-400 text-sm">
                  {(item.quantity * item.unitPrice).toLocaleString()} UZS
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-slate-700">
            <div className="flex items-center justify-between font-bold">
              <span>Total</span>
              <span>{order.totalAmount.toLocaleString()} UZS</span>
            </div>
          </div>
        </div>

        {/* Delivery Steps */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm mb-4">Delivery Progress</p>
          <DeliveryStepBar
            currentStep={order.status}
            onStepChange={handleStepChange}
          />
        </div>

        {/* Problem Report */}
        <button
          onClick={() => setShowProblemModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
          Report Problem
        </button>

        {/* Photo Proof (shown when status is ARRIVED) */}
        {order.status === 'ARRIVED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-slate-800 rounded-xl p-4"
          >
            <p className="text-slate-400 text-sm mb-3">Delivery Proof</p>
            <button className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors">
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Photo required to complete delivery
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
