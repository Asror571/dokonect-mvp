import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Store, Briefcase, User, Phone, MapPin, ArrowRight, Zap } from 'lucide-react';
import { registerFn } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name:     z.string().min(2, 'Kamida 2 belgi'),
  email:    z.string().email("Noto'g'ri email"),
  password: z.string().min(6, 'Kamida 6 belgi'),
  role:     z.enum(['STORE_OWNER', 'DISTRIBUTOR']),
  address:  z.string().min(5, 'Manzilni kiriting'),
  phone:    z.string().min(7, 'Telefon raqam kiriting'),
});
type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'DISTRIBUTOR' },
  });

  const selectedRole = watch('role');

  const { mutate, isPending } = useMutation({
    mutationFn: registerFn,
    onSuccess: (data) => {
      setAuth({ id: data.data.id, email: data.data.email, role: data.data.role, name: data.data.name }, data.data.token);
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      navigate(data.data.role === 'STORE_OWNER' ? '/catalog' : '/distributor/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-10">
      <div className="w-full max-w-lg fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">Doko<span className="text-violet-600">nect</span></span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Akkaunt yarating</h1>
            <p className="text-slate-500 text-sm">Platformaga qo'shiling</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Rolingiz
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'DISTRIBUTOR', icon: Briefcase, label: 'Distribyutor' },
                  { value: 'STORE_OWNER', icon: Store,     label: "Do'kon egasi" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value as any)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all',
                      selectedRole === value
                        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      selectedRole === value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={selectedRole === 'DISTRIBUTOR' ? 'Kompaniya nomi' : "Do'kon nomi"}
                placeholder="Dokonect MChJ"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
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
            </div>

            <Input
              label="Parol"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" isLoading={isPending} className="w-full" size="lg">
              {!isPending && <>Ro'yxatdan o'tish <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Allaqachon a'zomisiz?{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
