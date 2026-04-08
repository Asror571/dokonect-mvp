import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { format } from 'date-fns';

export const DriverEarningsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const { data: earnings } = useQuery({
    queryKey: ['driver-earnings', period],
    queryFn: () => api.get(`/driver/earnings?period=${period}`).then(res => res.data),
  });

  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Earnings</h1>
        <p className="text-slate-400">Track your income and bonuses</p>
      </div>

      {/* Total Earnings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 rounded-full">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-green-100 text-sm">Total Earnings</p>
            <p className="text-3xl font-bold">{(earnings?.total || 0).toLocaleString()} UZS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-100">
          <TrendingUp className="w-4 h-4" />
          <span>+12% from last {period}</span>
        </div>
      </motion.div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key as any)}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              period === tab.key
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bonuses */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Bonuses & Achievements</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">🔥</p>
            <p className="text-xs text-slate-400">7-Day Streak</p>
            <p className="text-sm font-bold text-amber-400">+50,000 UZS</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">⭐</p>
            <p className="text-xs text-slate-400">Top Rated</p>
            <p className="text-sm font-bold text-amber-400">+30,000 UZS</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">📦</p>
            <p className="text-xs text-slate-400">10 Deliveries</p>
            <p className="text-sm font-bold text-amber-400">+20,000 UZS</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">🚀</p>
            <p className="text-xs text-slate-400">Fast Delivery</p>
            <p className="text-sm font-bold text-amber-400">+15,000 UZS</p>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Earnings Breakdown</span>
          <button className="text-sky-400 text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="space-y-3">
          {earnings?.earnings?.map((earning: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
            >
              <div>
                <p className="font-medium">Order #{earning.orderId.slice(0, 8)}</p>
                <p className="text-xs text-slate-400">
                  {format(new Date(earning.date), 'MMM dd, HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">
                  +{earning.amount.toLocaleString()} UZS
                </p>
                {earning.bonus > 0 && (
                  <p className="text-xs text-amber-400">
                    +{earning.bonus.toLocaleString()} bonus
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {(!earnings?.earnings || earnings.earnings.length === 0) && (
          <div className="text-center py-8 text-slate-500">
            No earnings for this period
          </div>
        )}
      </div>

      {/* Withdrawal Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-sky-500 text-white py-4 rounded-xl font-bold hover:bg-sky-600 transition-colors shadow-lg"
      >
        Request Withdrawal
      </motion.button>
    </div>
  );
};
