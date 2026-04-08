import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package, Clock, Phone } from 'lucide-react';

interface OrderAcceptCardProps {
  order: {
    id: string;
    client: { user: { name: string; phone: string } };
    deliveryAddress: any;
    items: Array<{ product: { name: string }; quantity: number }>;
    totalAmount: number;
  };
  expiresIn: number; // seconds
  onAccept: () => void;
  onDecline: () => void;
}

export const OrderAcceptCard: React.FC<OrderAcceptCardProps> = ({
  order,
  expiresIn,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(expiresIn);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onDecline]);

  const progress = (timeLeft / expiresIn) * 100;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl"
    >
      {/* Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">New Order!</span>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-bold">{timeLeft}s</span>
          </div>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-white"
          />
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-white mt-0.5" />
          <div>
            <p className="text-white/80 text-sm">Customer</p>
            <p className="text-white font-semibold">{order.client.user.name}</p>
            <p className="text-white/80 text-sm">{order.client.user.phone}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-white mt-0.5" />
          <div>
            <p className="text-white/80 text-sm">Delivery Address</p>
            <p className="text-white font-medium">{order.deliveryAddress.street}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-white mt-0.5" />
          <div>
            <p className="text-white/80 text-sm">Items</p>
            {order.items.slice(0, 2).map((item, idx) => (
              <p key={idx} className="text-white text-sm">
                {item.quantity}x {item.product.name}
              </p>
            ))}
            {order.items.length > 2 && (
              <p className="text-white/80 text-xs">+{order.items.length - 2} more</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-white/20">
          <p className="text-white text-lg font-bold">
            {order.totalAmount.toLocaleString()} UZS
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDecline}
          className="flex-1 bg-white/20 text-white py-4 rounded-xl font-bold hover:bg-white/30 transition-colors"
        >
          Decline
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAccept}
          className="flex-1 bg-white text-orange-600 py-4 rounded-xl font-bold hover:bg-white/90 transition-colors shadow-lg"
        >
          Accept Order
        </motion.button>
      </div>
    </motion.div>
  );
};
