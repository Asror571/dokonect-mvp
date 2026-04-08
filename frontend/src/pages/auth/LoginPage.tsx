import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loginType, setLoginType] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Attempting login...', { phone, email, loginType });
      
      const response = await api.post('/auth/login', {
        ...(loginType === 'email' ? { email } : { phone }),
        password,
      });

      console.log('✅ Login response:', response.data);

      const { user, accessToken, refreshToken } = response.data.data;
      
      console.log('👤 User:', user);
      console.log('🔑 Token:', accessToken?.substring(0, 20) + '...');
      
      // Update Global State
      setAuth(user, accessToken, refreshToken);

      console.log('💾 Auth state updated');
      console.log('📦 localStorage check:', {
        token: localStorage.getItem('accessToken')?.substring(0, 20) + '...',
        user: localStorage.getItem('user') ? 'saved' : 'missing',
        authStore: localStorage.getItem('auth-storage') ? 'saved' : 'missing'
      });

      toast.success('Xush kelibsiz!');

      // Redirect based on role
      console.log('🚀 Redirecting to:', user.role);
      
      let redirectPath = '/';
      if (user.role === 'DISTRIBUTOR') {
        redirectPath = '/distributor/dashboard';
      } else if (user.role === 'CLIENT') {
        redirectPath = '/store/dashboard';
      } else if (user.role === 'DRIVER') {
        redirectPath = '/driver/dashboard';
      } else if (user.role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      }
      
      console.log('🎯 Navigating to:', redirectPath);
      
      // Force immediate redirect with location.replace
      window.location.replace(redirectPath);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast.error(error.response?.data?.message || 'Login xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-600/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-600/20 transform -rotate-6">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Doko<span className="text-indigo-400">nect</span></h1>
          <p className="text-slate-400 mt-2 font-medium">B2B Platformaning kelajagi</p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
          <button
            type="button"
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold transition-all ${
              loginType === 'phone'
                ? 'bg-white text-slate-900 shadow-xl'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Telefon
          </button>
          <button
            type="button"
            onClick={() => setLoginType('email')}
            className={`flex-1 py-4 px-4 rounded-xl text-sm font-bold transition-all ${
              loginType === 'email'
                ? 'bg-white text-slate-900 shadow-xl'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {loginType === 'email' ? (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest translate-x-1 mb-2">
                Email manzil
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dokonect.uz"
                  required
                  className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest translate-x-1 mb-2">
                Telefon raqam
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                  className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
             <div className="flex items-center justify-between mb-2 translate-x-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Parol
                </label>
                <button type="button" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Unutdingizmi?</button>
             </div>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="w-5 h-5" />
                </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Kirish...' : 'Tizimga kirish'}
          </motion.button>
        </form>

        {/* Test Accounts */}
        <div className="mt-10 p-5 bg-white/5 border border-white/10 rounded-[24px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Test hisoblar (Parol: 123456)
          </p>
          <div className="space-y-3">
            <button type="button" className="w-full flex items-center justify-between group cursor-pointer" onClick={() => { setLoginType('phone'); setPhone('+998901234567'); setPassword('123456'); }}>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Distribyutor</span>
                <span className="text-[10px] font-mono text-slate-500">+998901234567</span>
            </button>
            <button type="button" className="w-full flex items-center justify-between group cursor-pointer" onClick={() => { setLoginType('phone'); setPhone('+998901234500'); setPassword('123456'); }}>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Do'kon egasi</span>
                <span className="text-[10px] font-mono text-slate-500">+998901234500</span>
            </button>
            <button type="button" className="w-full flex items-center justify-between group cursor-pointer" onClick={() => { setLoginType('phone'); setPhone('+998900000000'); setPassword('123456'); }}>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Admin</span>
                <span className="text-[10px] font-mono text-slate-500">+998900000000</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
