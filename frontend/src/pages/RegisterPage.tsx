import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const passwordStrength = {
    hasLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setAuth(response.data.user, response.data.token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#42A090] via-[#389080] to-[#2d7a6d] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Acta" className="w-14 h-14 drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-display font-bold text-white tracking-tight">Acta</h1>
              <p className="text-teal-100 text-sm font-medium tracking-wide">Meeting Intelligence</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 relative z-10">
          <h3 className="text-2xl font-display font-bold text-white">
            Get Started in Minutes
          </h3>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Create your account</h4>
                <p className="text-teal-100 text-sm">Quick and easy signup</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Add your first meeting</h4>
                <p className="text-teal-100 text-sm">Input discussion or upload audio</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Get AI-generated MoM</h4>
                <p className="text-teal-100 text-sm">Summary, decisions & action items</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-teal-200/70 text-sm relative z-10">
          © 2026 Acta. All rights reserved.
        </p>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="Acta" className="w-12 h-12" />
              <h1 className="text-3xl font-display font-bold text-[#42A090]">Acta</h1>
            </div>
            <p className="text-slate-500 font-medium">Meeting Intelligence</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900">Create account</h2>
              <p className="text-slate-500 mt-2">Start managing meetings smarter</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all bg-slate-50 focus:bg-white ${
                      errors.name ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all bg-slate-50 focus:bg-white ${
                      errors.email ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all bg-slate-50 focus:bg-white ${
                      errors.password ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
                
                {/* Password Strength Indicators */}
                {password && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${passwordStrength.hasLength ? 'text-[#42A090]' : 'text-slate-300'}`} />
                      <span className={passwordStrength.hasLength ? 'text-[#42A090] font-medium' : 'text-slate-400'}>
                        At least 6 characters
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all bg-slate-50 focus:bg-white ${
                      errors.confirmPassword ? 'border-red-400' : 'border-slate-200'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#42A090] hover:bg-[#389080] text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#42A090]/30 hover:shadow-xl hover:shadow-[#42A090]/40 hover:-translate-y-0.5 active:translate-y-0 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-8 text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#42A090] hover:text-[#389080] font-bold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
