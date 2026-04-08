import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Bell, Search, Globe, ChevronDown, User, LogOut, Settings, Shield, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Topbar = () => {
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Yangi buyurtma', body: '#ORD-9283 keldi', time: '2 daq oldin', icon: Zap, color: 'text-amber-500' },
    { id: 2, title: 'Chat xabari', body: 'Alisher: "Mahsulot qachon keladi?"', time: '10 daq oldin', icon: Globe, color: 'text-sky-500' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/80">
      
      {/* Left: Global Search */}
      <div className="relative flex-1 max-w-md hidden md:block group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Global qidiruv..." 
          className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all border-none font-medium"
        />
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        
        {/* Language Switch */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-xs">
          <Globe className="w-4 h-4" />
          <span>UZ</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-indigo-50 text-indigo-600 scale-110' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-ping" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Bildirishnomalar</span>
                  <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-lg font-bold">YANGI</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 group">
                      <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${n.color}`}>
                        <n.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{n.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 text-xs font-black text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 tracking-widest uppercase transition-colors">Barchasini ko'rish</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
              {user?.name?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left mr-2">
              <p className="text-[11px] font-black text-slate-900 leading-none truncate max-w-[100px] uppercase tracking-tighter">{user?.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Admin</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180 text-indigo-500' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-60 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-50 p-2"
              >
                 <div className="p-3 border-b border-slate-50">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 pl-2">Hisobingiz</p>
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black uppercase">
                        {user?.name?.slice(0, 1).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tighter">{user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.phone}</p>
                        </div>
                    </div>
                 </div>
                 <div className="p-1 space-y-0.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
                        <User className="w-4 h-4 group-hover:scale-110 transition-transform" /> Mening Profilim
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
                        <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" /> Sozlamalar
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
                        <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" /> Xavfsizlik
                    </button>
                 </div>
                 <div className="p-1 border-t border-slate-50 pt-1">
                    <button 
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Tizimdan chiqish
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};

export default Topbar;
