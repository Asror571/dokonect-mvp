import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfileFn } from '../api/auth.api';
import api from '../api/api';
import { useAuthStore } from '../store/auth.store';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Phone, MapPin, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name:    z.string().min(2, 'Kamida 2 belgi'),
  address: z.string().min(5, 'Manzilni kiriting'),
  phone:   z.string().min(7, 'Telefon raqam kiriting'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfileFn,
  });
  const profile = profileRes?.data;

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      name:    profile.storeName || profile.companyName || '',
      address: profile.address || '',
      phone:   profile.phone || '',
    } : undefined,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProfileForm) => api.put('/profile', data),
    onSuccess: () => {
      toast.success('Profil yangilandi');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="page max-w-2xl fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Profil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ma'lumotlaringizni yangilang</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-white font-semibold text-base">{user?.name}</p>
            <p className="text-violet-200 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user?.role === 'STORE_OWNER' ? "Do'kon egasi" : 'Distribyutor'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {/* Email readonly */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-slate-700">{user?.email}</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase">
              O'zgarmas
            </span>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <Input
              label={user?.role === 'STORE_OWNER' ? "Do'kon nomi" : 'Kompaniya nomi'}
              placeholder="Dokonect MChJ"
              leftIcon={<Building2 className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Telefon"
              placeholder="+998 90 123 45 67"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Manzil"
              placeholder="Toshkent, Chilonzor"
              leftIcon={<MapPin className="w-4 h-4" />}
              error={errors.address?.message}
              {...register('address')}
            />
            <Button type="submit" isLoading={isPending} className="w-full mt-2" size="lg">
              {!isPending && 'Saqlash'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
