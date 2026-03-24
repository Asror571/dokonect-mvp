import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:shadow-none',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-5 text-sm rounded-xl',
      lg: 'h-12 px-7 text-sm rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none',
          variants[variant],
          sizes[size],
          isLoading && 'cursor-not-allowed opacity-70',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Kuting...
          </span>
        ) : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
