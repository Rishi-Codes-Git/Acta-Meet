import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2fa, setRequires2fa] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.data?.requires_2fa) {
        setRequires2fa(true);
        setPendingUserId(response.data.user_id);
        toast.success('OTP sent to your email');
        return;
      }
      setAuth(response.data.user, response.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!pendingUserId || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyLogin2fa({ user_id: pendingUserId, otp: otpCode });
      setAuth(response.data.user, response.data.token);
      toast.success('Login successful');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'OTP verification failed');
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
        
        <div className="space-y-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-display font-bold text-white mb-4">
              Transform Your Meetings
            </h3>
            <p className="text-teal-50 leading-relaxed text-lg">
              AI-powered meeting minutes generation. Capture discussions, 
              extract action items, and track progress — all automatically.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-11 h-11 rounded-full bg-white/90 border-2 border-white flex items-center justify-center text-[#42A090] font-bold text-sm shadow-lg">JD</div>
              <div className="w-11 h-11 rounded-full bg-white/80 border-2 border-white flex items-center justify-center text-[#42A090] font-bold text-sm shadow-lg">SK</div>
              <div className="w-11 h-11 rounded-full bg-white/70 border-2 border-white flex items-center justify-center text-[#42A090] font-bold text-sm shadow-lg">MR</div>
            </div>
            <p className="text-white/90 text-sm font-medium">
              Join teams already using Acta
            </p>
          </div>
        </div>

        <p className="text-teal-200/70 text-sm relative z-10">
          © 2026 Acta. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
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
              <h2 className="text-2xl font-display font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 mt-2">Sign in to your account</p>
            </div>

            {!requires2fa ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#42A090] hover:bg-[#389080] text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#42A090]/30 hover:shadow-xl hover:shadow-[#42A090]/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <p className="text-sm font-medium text-teal-900 mb-1">📧 Two-Factor Verification</p>
                  <p className="text-sm text-teal-700">Enter the 6-digit OTP sent to your email.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#42A090]/20 focus:border-[#42A090] transition-all bg-slate-50 focus:bg-white border-slate-200 text-center text-xl tracking-widest"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyLoginOtp}
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full bg-[#42A090] hover:bg-[#389080] text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP & Sign In'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequires2fa(false);
                    setPendingUserId('');
                    setOtpCode('');
                  }}
                  className="w-full text-slate-600 hover:text-slate-800 font-medium"
                >
                  Back to login
                </button>
              </div>
            )}

            {/* Register Link */}
            <p className="text-center mt-8 text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#42A090] hover:text-[#389080] font-bold transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
