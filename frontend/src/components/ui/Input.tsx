import React from 'react';
import { cn } from './Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, hint, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all',
            'shadow-sm',
            leftIcon && 'pl-10',
            error
              ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400 bg-red-50/30'
              : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';
