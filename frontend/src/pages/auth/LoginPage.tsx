import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { loginFn } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email("Noto'g'ri email formati"),
  password: z.string().min(6, 'Parol kamida 6 belgi'),
});
type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      setAuth({ id: data.data.id, email: data.data.email, role: data.data.role, name: data.data.name }, data.data.token);
      toast.success('Xush kelibsiz!');
      navigate(data.data.role === 'STORE_OWNER' ? '/catalog' : '/distributor/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    },
  });

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-slate-900" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Doko<span className="text-violet-400">nect</span></span>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-bold text-white leading-tight">
            B2B savdo<br />platformasi
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Distribyutorlar va do'kon egalari uchun qulay ulgurji savdo tizimi.
          </p>
          <div className="flex gap-3 pt-2">
            {['Tezkor', 'Ishonchli', 'Qulay'].map((tag) => (
              <span key={tag} className="bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-slate-600 text-xs">
          © 2025 Dokonect. Barcha huquqlar himoyalangan.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm fade-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800">Doko<span className="text-violet-600">nect</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Tizimga kirish</h1>
            <p className="text-slate-500 text-sm">Akkauntingizga kiring</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Parol"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" isLoading={isPending} className="w-full mt-2" size="lg">
              {!isPending && <>Kirish <ArrowRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Akkaunt yo'qmi?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:text-violet-700">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
