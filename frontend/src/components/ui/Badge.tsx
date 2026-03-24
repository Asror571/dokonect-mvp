import React from 'react';
import { cn } from './Button';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', className, ...props }) => {
  const variants = {
    primary:   'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    secondary: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    success:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    warning:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    danger:    'bg-red-50 text-red-600 ring-1 ring-red-200',
    info:      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
