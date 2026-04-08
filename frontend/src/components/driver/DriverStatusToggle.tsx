import React from 'react';
import { motion } from 'framer-motion';

interface DriverStatusToggleProps {
  isOnline: boolean;
  onChange: (status: boolean) => void;
  disabled?: boolean;
}

export const DriverStatusToggle: React.FC<DriverStatusToggleProps> = ({
  isOnline,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-2xl">
      <p className="text-lg font-semibold text-white">
        {isOnline ? "You're Online" : "You're Offline"}
      </p>
      
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => !disabled && onChange(!isOnline)}
        disabled={disabled}
        className={`relative w-32 h-16 rounded-full transition-colors ${
          isOnline ? 'bg-green-500' : 'bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <motion.div
          animate={{ x: isOnline ? 64 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-2 left-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <div className={`w-6 h-6 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
        </motion.div>
      </motion.button>

      <p className="text-sm text-slate-400">
        {isOnline ? 'Tap to go offline' : 'Tap to start receiving orders'}
      </p>
    </div>
  );
};
