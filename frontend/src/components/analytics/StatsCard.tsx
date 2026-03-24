import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../ui/Button';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'violet' | 'emerald' | 'amber' | 'blue' | 'rose';
  subtitle?: string;
}

const colorMap = {
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  rose: 'bg-rose-50 text-rose-600',
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color = 'violet', subtitle }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colorMap[color])}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default StatsCard;
