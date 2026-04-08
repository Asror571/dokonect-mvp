import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Wallet, TrendingUp, AlertTriangle, ArrowUpRight, History, Calendar, CheckSquare, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'framer-motion';

const FinancePage = () => {
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['finance-summary'],
        queryFn: async () => {
            const res = await api.get('/client/finance/summary');
            return res.data;
        }
    });

    const { data: orders, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['client-orders-finance'],
        queryFn: async () => {
            const res = await api.get('/client/orders');
            return res.data;
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
          case 'PAID': return 'success';
          case 'PARTIAL': return 'warning';
          case 'UNPAID': return 'warning';
          case 'OVERDUE': return 'danger';
          default: return 'secondary';
        }
    };

    const cards = [
        {
            label: "Jami qarzdorlik",
            value: summary?.totalDebt?.toLocaleString() || '0',
            icon: Wallet,
            color: "bg-indigo-600",
            subtext: "Barcha distribyutorlardan",
            trend: "Ayni vaqtda"
        },
        {
            label: "Muddati o'tgan",
            value: summary?.overdueDebt?.toLocaleString() || '0',
            icon: AlertTriangle,
            color: "bg-red-500",
            subtext: "Tezroq to'lash tavsiya etiladi",
            trend: summary?.overdueDebt > 0 ? "Kritik" : "Hammasi joyida"
        },
        {
            label: "Bu oygi xaridlar",
            value: summary?.totalSpent?.toLocaleString() || '0',
            icon: TrendingUp,
            color: "bg-emerald-500",
            subtext: "O'tgan oyga nisbatan +12%",
            trend: "O'smoqda"
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-8">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">Moliya va Hisob-kitob</h1>
                   <p className="text-slate-500 font-medium mt-1">To'lovlar tarixi, qarzdorliklar ve limitlarni kuzatib boring.</p>
                </div>
                <button className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                    <ArrowUpRight className="w-4 h-4" /> To'lov kiritish
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={card.label}
                        className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group"
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.color} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                        
                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-4 rounded-2xl ${card.color} text-white shadow-xl shadow-indigo-500/10`}>
                                <card.icon className="w-6 h-6 shrink-0" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">{card.trend}</span>
                        </div>
                        
                        <p className="text-sm font-bold text-slate-500 mb-1">{card.label}</p>
                        <div className="flex items-baseline gap-2">
                             <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</h2>
                             <span className="text-xs font-black text-slate-400">UZS</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                             <CheckSquare className="w-3 h-3" /> {card.subtext}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction List */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <History className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Xaridlar va To'lovlar</h2>
                         </div>
                         <div className="flex gap-2">
                            <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600 transition-colors">
                                <Calendar className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600 transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                <tr>
                                    <th className="px-8 py-4">ID / Vazifa</th>
                                    <th className="px-8 py-4 text-center">Status</th>
                                    <th className="px-8 py-4 text-right">Summa</th>
                                    <th className="px-8 py-4 text-right">Amaliyot</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                                {orders?.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-indigo-500 font-mono tracking-tight uppercase">ORD-{order.id.slice(0, 8)}</span>
                                                <span className="text-sm font-bold text-slate-900 mt-1">{order.distributor?.companyName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{format(new Date(order.createdAt), "dd MMMM", { locale: uz })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <Badge variant={getStatusColor(order.paymentStatus) as any} className="font-black text-[10px] tracking-widest uppercase">
                                                {order.paymentStatus || 'UNPAID'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-sm font-black text-slate-900">{order.totalAmount?.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">UZS</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                             <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-100 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
                                                 Batafsil
                                             </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!orders || orders.length === 0) && !isOrdersLoading && (
                                     <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <p className="text-slate-400 font-bold">Hech qanday amaliyot topilmadi</p>
                                        </td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-[40px] p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                        <h3 className="text-lg font-black tracking-tight mb-4">Moliyaviy Maslahat</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                            Sizning bu oygi xarajatlaringiz o'rtacha ko'rsatkichdan 15% yuqori. Mahsulotlaringizni "Bulk Order" (ulgurji) orqali xarid qilishni tavsiya etamiz.
                        </p>
                        <button className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-colors">
                            Limitni oshirish
                        </button>
                    </div>

                    <div className="bg-indigo-50 rounded-[40px] p-8 border border-indigo-100">
                        <h3 className="text-lg font-black text-indigo-900 tracking-tight mb-4">Distribyutor Limitlari</h3>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-indigo-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-800">Korzinka.uz Distrib</span>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">70% ishlatildi</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="w-[70%] h-full bg-indigo-600 rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">12,000,000 / 20,000,000 UZS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancePage;
