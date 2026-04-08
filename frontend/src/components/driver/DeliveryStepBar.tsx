import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, Truck, MapPin, CheckCircle } from 'lucide-react';

type DeliveryStep = 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED';

interface DeliveryStepBarProps {
  currentStep: DeliveryStep;
  onStepChange: (step: DeliveryStep) => void;
}

const steps: Array<{ key: DeliveryStep; label: string; icon: any }> = [
  { key: 'PICKED_UP', label: 'Picked Up', icon: Package },
  { key: 'IN_TRANSIT', label: 'On the Way', icon: Truck },
  { key: 'ARRIVED', label: 'Arrived', icon: MapPin },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export const DeliveryStepBar: React.FC<DeliveryStepBarProps> = ({
  currentStep,
  onStepChange,
}) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isDisabled = index > currentIndex + 1;

        return (
          <motion.button
            key={step.key}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            onClick={() => !isDisabled && onStepChange(step.key)}
            disabled={isDisabled}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
              isCompleted
                ? 'bg-green-500 text-white'
                : isCurrent
                ? 'bg-sky-500 text-white shadow-lg'
                : isDisabled
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-white/20'
                  : isCurrent
                  ? 'bg-white/20'
                  : 'bg-slate-600'
              }`}
            >
              {isCompleted ? (
                <Check className="w-6 h-6" />
              ) : (
                <Icon className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="font-bold text-lg">{step.label}</p>
              {isCurrent && (
                <p className="text-sm opacity-80">Tap to confirm</p>
              )}
            </div>

            {isCurrent && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-3 h-3 bg-white rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
