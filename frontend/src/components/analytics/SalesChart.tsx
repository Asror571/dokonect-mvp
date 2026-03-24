import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface SalesChartProps {
  data: { date: string; revenue: number }[];
  title?: string;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, title = 'Sotuv grafigi' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => { try { return format(parseISO(d), 'dd/MM'); } catch { return d; } }}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [`${v.toLocaleString('uz-UZ')} UZS`, 'Daromad']}
          labelFormatter={(l) => { try { return format(parseISO(l), 'dd MMM yyyy'); } catch { return l; } }}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default SalesChart;
