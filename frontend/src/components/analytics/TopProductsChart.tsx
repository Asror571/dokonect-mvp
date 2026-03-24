import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopProductsChartProps {
  data: { name: string; totalSold: number }[];
  title?: string;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data, title = 'Top mahsulotlar' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category" dataKey="name" width={110}
          tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
          tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
        />
        <Tooltip
          formatter={(v: number) => [v, 'Sotilgan']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="totalSold" fill="#7c3aed" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TopProductsChart;
