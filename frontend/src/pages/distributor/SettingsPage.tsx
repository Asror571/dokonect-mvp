import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Settings, User, Bell, Shield, Smartphone, Globe, Building2, Save, X, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['distributor-profile'],
    queryFn: async () => {
      const response = await api.get('/distributor/profile');
      return response.data?.data || {};
    },
    staleTime: 60000 * 5,
  });

  const profile = profileResponse || {};

  const handleSave = () => {
    toast.success("Sozlamalar saqlandi!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 underline decoration-sky-500 underline-offset-8">Tizim Sozlamalari</h1>
          <p className="text-slate-500 text-sm mt-1">Platformadagi profilingiz va bildirishnomalarni boshqaring.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" className="px-5 font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest">
            <X className="w-4 h-4 mr-2" /> Bekor qilish
          </Button>
          <Button onClick={handleSave} className="px-5 font-bold text-sm bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 uppercase tracking-widest">
            <Save className="w-4 h-4 mr-2" /> Saqlash
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-sky-50 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Building2 className="w-4 h-4" /> Kompaniya Profil
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-sky-50 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Bell className="w-4 h-4" /> Bildirishnomalar
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-sky-50 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Shield className="w-4 h-4" /> Xavfsizlik
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tighter uppercase">
                  <User className="w-5 h-5 text-sky-500" /> Shaxsiy Ma'lumotlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Kompaniya Nomi" defaultValue={profile.companyName} icon={<Building2 className="w-4 h-4" />} />
                  <Input label="Distribyutor ID" defaultValue={`DIST-${profile.id?.slice(0,8)}`} icon={<Shield className="w-4 h-4" />} readOnly />
                  <Input label="Email" defaultValue={profile.email} icon={<Mail className="w-4 h-4" />} />
                  <Input label="Telefon" defaultValue={profile.phone} icon={<Phone className="w-4 h-4" />} />
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden group">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 underline decoration-sky-300 underline-offset-4 tracking-tighter uppercase">
                   Manzil va Hudud
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Kompaniya Manzili" defaultValue={profile.address} icon={<MapPin className="w-4 h-4" />} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Website" placeholder="https://company.uz" icon={<Globe className="w-4 h-4" />} />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">Asosiy Hudud</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium">
                        <option value="tashkent">Toshkent shahar</option>
                        <option value="samarkand">Samarqand viloyati</option>
                        <option value="fergana">Farg'ona viloyati</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm divide-y divide-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tighter uppercase underline decoration-indigo-500 decoration-2 underline-offset-8">
                Bildirishnoma Sozlamalari
              </h3>
              
              <div className="py-5 flex items-center justify-between group">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-all uppercase text-sm tracking-tight">Yangi Buyurtmalar</p>
                  <p className="text-xs text-slate-500 mt-0.5">Yangi buyurtma kelganda email/SMS orqali xabar berish</p>
                </div>
                <div className="w-12 h-6 bg-sky-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                </div>
              </div>

              <div className="py-5 flex items-center justify-between group">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-all uppercase text-sm tracking-tight">Sklad Ogohlantirishlari</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mahsulot kam qolganda bildirishnoma ko'rsatish</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                </div>
              </div>

              <div className="py-5 flex items-center justify-between group">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-all uppercase text-sm tracking-tight">Chat Xabarlari</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mijozlar(Store Owners) xabar yozganda realtime xabar berish</p>
                </div>
                <div className="w-12 h-6 bg-sky-500 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 underline underline-offset-8 decoration-red-500 tracking-tighter uppercase font-black">
                Xavfsizlik & Parol
              </h3>
              <div className="space-y-4">
                <Input label="Joriy parol" type="password" />
                <Input label="Yangi parol" type="password" />
                <Input label="Yangi parolni tasdiqlang" type="password" />
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 mt-4 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-xs">
                  Parolni Yangilash
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
