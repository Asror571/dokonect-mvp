import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

type Status = 
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP'
  | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED'
  | 'FAILED' | 'CANCELLED' | 'ONLINE' | 'OFFLINE';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100' },
  PREPARING: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-100' },
  READY_FOR_PICKUP: { label: 'Ready', color: 'text-purple-700', bg: 'bg-purple-100' },
  PICKED_UP: { label: 'Picked Up', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ARRIVED: { label: 'Arrived', color: 'text-teal-700', bg: 'bg-teal-100' },
  DELIVERED: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100' },
  FAILED: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' },
  ONLINE: { label: 'Online', color: 'text-green-700', bg: 'bg-green-100' },
  OFFLINE: { label: 'Offline', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  animated = true 
}) => {
  const config = statusConfig[status];
  
  const Component = animated ? motion.span : 'span';
  const animationProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      {...animationProps}
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        config.color,
        config.bg,
        sizeClasses[size]
      )}
    >
      {config.label}
    </Component>
  );
};
