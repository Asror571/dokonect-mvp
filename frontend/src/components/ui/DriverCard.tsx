import React from 'react';
import { motion } from 'framer-motion';
import { Star, Truck, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface DriverCardProps {
  driver: {
    id: string;
    user: {
      name: string;
      avatar?: string;
    };
    vehicleType: string;
    vehicleNumber: string;
    rating: number;
    totalDeliveries: number;
    isOnline: boolean;
  };
  todayDeliveries?: number;
  onClick?: () => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  todayDeliveries = 0,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          {driver.user.avatar ? (
            <img
              src={driver.user.avatar}
              alt={driver.user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {driver.user.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <StatusBadge
              status={driver.isOnline ? 'ONLINE' : 'OFFLINE'}
              size="sm"
            />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{driver.user.name}</h3>
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-gray-700">{driver.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">
              ({driver.totalDeliveries} deliveries)
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="w-4 h-4" />
            <span>{driver.vehicleType} • {driver.vehicleNumber}</span>
          </div>

          {todayDeliveries > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Today: </span>
              <span className="font-semibold text-sky-600">{todayDeliveries} orders</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
