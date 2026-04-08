import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineItem {
  status: string;
  timestamp: string;
  note?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  currentStatus: string;
}

const statusOrder = [
  'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
  'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'
];

export const Timeline: React.FC<TimelineProps> = ({ items, currentStatus }) => {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const itemIndex = statusOrder.indexOf(item.status);
        const isCompleted = itemIndex <= currentIndex;
        const isCurrent = item.status === currentStatus;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-sky-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
              </div>
              {idx < items.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            <div className="flex-1 pb-8">
              <p className={`font-medium ${isCurrent ? 'text-sky-600' : 'text-gray-900'}`}>
                {item.status.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
              </p>
              {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
