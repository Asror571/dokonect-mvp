import React from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, Clock, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    totalAmount: number;
    deliveryAddress: any;
    createdAt: string;
    client?: { name: string };
    items?: Array<{ product: { name: string }; quantity: number }>;
  };
  variant?: 'compact' | 'expanded';
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  variant = 'compact',
  onClick,
  actions,
}) => {
  const isExpanded = variant === 'expanded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg">
            <Package className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="font-mono text-sm text-gray-600">#{order.id.slice(0, 8)}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status as any} size="sm" />
      </div>

      {isExpanded && order.items && (
        <div className="mb-3 space-y-1">
          {order.items.slice(0, 3).map((item, idx) => (
            <p key={idx} className="text-sm text-gray-600">
              {item.quantity}x {item.product.name}
            </p>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        {order.client && (
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{order.client.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span className="truncate max-w-[150px]">
            {order.deliveryAddress?.street || 'Address'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900">
          {order.totalAmount.toLocaleString()} UZS
        </p>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
};
