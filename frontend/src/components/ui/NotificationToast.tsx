import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationToastProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  playSound?: boolean;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const iconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
  playSound = false,
}) => {
  const Icon = icons[type];

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  useEffect(() => {
    if (isVisible && playSound) {
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }
  }, [isVisible, playSound]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-4 right-4 z-50 max-w-md w-full ${colors[type]} border rounded-lg shadow-lg p-4`}
        >
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1">{title}</h4>
              <p className="text-sm opacity-90">{message}</p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
