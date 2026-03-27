import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Heart, Mail, Lock, ArrowRight, Activity, Shield, Stethoscope, ClipboardList } from 'lucide-react';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken, rememberMe);
      localStorage.setItem('auth-token', accessToken);

      toast.success('Login successful!');

      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'DOCTOR':
          navigate('/doctor/dashboard');
          break;
        case 'NURSE':
          navigate('/nurse/dashboard');
          break;
        case 'PHARMACIST':
          navigate('/pharmacy/dashboard');
          break;
        case 'LAB_TECH':
          navigate('/lab/dashboard');
          break;
        case 'RECEPTIONIST':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-login-page-load">
      {/* ============================================
          LEFT SIDE - FUTURISTIC BACKGROUND WITH ANIMATIONS
          Background: #0F172A → #2563EB → #14B8A6
          ============================================ */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 50%, #14B8A6 100%)',
        }}
      >
        {/* Animated Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs with enhanced animations */}
          <div 
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse-slow"
            style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)' }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl animate-float-orb"
            style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)' }}
          ></div>
          <div 
            className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full blur-3xl animate-pulse-slow-alt"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          ></div>
          <div 
            className="absolute bottom-1/3 left-1/3 w-[250px] h-[250px] rounded-full blur-3xl animate-depth-pulse"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
          ></div>
          
          {/* Enhanced dot grid pattern */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]"
          ></div>
          
          {/* Digital grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="digital-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(37, 99, 235, 0.5)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#digital-grid)"/>
          </svg>
          
          {/* Healthcare-themed SVG Pattern - Medical Crosses */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-medical-cross" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <g fill="rgba(255,255,255,0.8)" transform="translate(42, 42)">
                  <rect x="4" y="0" width="8" height="16" rx="2"/>
                  <rect x="0" y="4" width="16" height="8" rx="2"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-medical-cross)"/>
          </svg>
          
          {/* Enhanced ECG Line Animation */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="auth-ecg-line" x="0" y="0" width="300" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M0,40 L40,40 L50,40 L60,15 L70,65 L80,30 L90,50 L100,40 L150,40 L160,40 L170,20 L180,60 L190,40 L300,40"
                  fill="none"
                  stroke="url(#ecg-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(37, 99, 235, 0.3)" />
                    <stop offset="50%" stopColor="rgba(37, 99, 235, 0.8)" />
                    <stop offset="100%" stopColor="rgba(20, 184, 166, 0.3)" />
                  </linearGradient>
                </defs>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-ecg-line)" className="animate-ecg-slide"/>
          </svg>
          
          {/* DNA Helix Pattern */}
          <svg className="absolute top-0 right-0 w-[300px] h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 400">
            <g>
              {[...Array(8)].map((_, i) => (
                <g key={i} transform={`translate(50, ${i * 50 + 25})`}>
                  <ellipse cx="0" cy="0" rx="30" ry="8" fill="none" stroke="rgba(37, 99, 235, 0.6)" strokeWidth="1.5"/>
                  <circle cx="-20" cy="0" r="4" fill="rgba(37, 99, 235, 0.4)"/>
                  <circle cx="20" cy="0" r="4" fill="rgba(20, 184, 166, 0.4)"/>
                </g>
              ))}
            </g>
          </svg>
          
          {/* Floating particles with enhanced effects */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full animate-float-particle" style={{ backgroundColor: 'rgba(96, 165, 250, 0.5)', boxShadow: '0 0 20px rgba(96, 165, 250, 0.3)' }}></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full animate-float-particle-delayed" style={{ backgroundColor: 'rgba(45, 212, 191, 0.5)', boxShadow: '0 0 20px rgba(45, 212, 191, 0.3)' }}></div>
          <div className="absolute top-2/3 left-1/4 w-2.5 h-2.5 rounded-full animate-float-particle-slow" style={{ backgroundColor: 'rgba(34, 211, 238, 0.4)', boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full animate-float-particle" style={{ backgroundColor: 'rgba(167, 139, 250, 0.4)', boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)', animationDelay: '3s' }}></div>
          <div className="absolute bottom-1/4 right-1/5 w-2 h-2 rounded-full animate-float-particle-delayed" style={{ backgroundColor: 'rgba(147, 197, 253, 0.3)' }}></div>
          
          {/* Pulse monitoring circles */}
          <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full animate-pulse-slow" style={{ border: '1px solid rgba(96, 165, 250, 0.2)' }}></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full animate-pulse-slow-alt" style={{ border: '1px solid rgba(45, 212, 191, 0.1)' }}></div>
        </div>

        {/* Content with entrance animations */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20 animate-login-content">
          {/* Logo with heartbeat animation */}
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                boxShadow: '0 20px 40px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white tracking-tight">HMS</span>
              <span className="text-[11px] text-slate-400 tracking-[0.2em] font-medium">HEALTHCARE SYSTEM</span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white mb-6 leading-tight">
            Welcome to Your<br />
            <span 
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #60A5FA, #22D3EE, #2DD4BF)',
              }}
            >
              Healthcare Dashboard
            </span>
          </h1>
          
          <p className="text-lg xl:text-xl text-slate-300 mb-10 max-w-lg leading-relaxed">
            Access your dashboard, manage appointments, and provide exceptional patient care through our integrated platform.
          </p>

          {/* Feature Cards with staggered animations */}
          <div className="space-y-4">
            <div 
              className="flex items-center gap-4 p-5 rounded-2xl animate-feature-card animate-feature-card-1 animate-feature-float"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(37, 99, 235, 0.2))',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                }}
              >
                <Shield className="w-7 h-7" style={{ color: '#60A5FA' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Secure Access</h3>
                <p className="text-sm text-slate-400">HIPAA compliant authentication</p>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-4 p-5 rounded-2xl animate-feature-card animate-feature-card-2 animate-feature-float-delayed"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.3), rgba(20, 184, 166, 0.2))',
                  border: '1px solid rgba(45, 212, 191, 0.2)',
                }}
              >
                <Activity className="w-7 h-7" style={{ color: '#2DD4BF' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Real-time Analytics</h3>
                <p className="text-sm text-slate-400">Track patient metrics instantly</p>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-4 p-5 rounded-2xl animate-feature-card animate-feature-card-3 animate-feature-float"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animationDelay: '2s',
              }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.2))',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                }}
              >
                <ClipboardList className="w-7 h-7" style={{ color: '#22D3EE' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Easy Management</h3>
                <p className="text-sm text-slate-400">Streamlined workflow tools</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(30, 58, 138, 0.3), transparent)',
          }}
        ></div>
      </div>

      {/* ============================================
          RIGHT SIDE - LOGIN FORM WITH GLASSMORPHISM
          Glass-style panel: rgba(255,255,255,0.85) with blur
          ============================================ */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, rgba(239, 246, 255, 0.3) 50%, #F1F5F9 100%)',
        }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.4), transparent)' }}
          ></div>
          <div 
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(204, 251, 241, 0.3), transparent)' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(90deg, rgba(239, 246, 255, 0.2), rgba(240, 253, 250, 0.2))' }}
          ></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-login-panel">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight" style={{ color: '#0F172A' }}>HMS</span>
              <span className="text-[10px] -mt-0.5 tracking-widest" style={{ color: '#64748B' }}>HEALTHCARE</span>
            </div>
          </div>

          {/* Glassmorphic Login Panel */}
          <div 
            className="rounded-3xl p-8 sm:p-10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 25px 50px rgba(15, 23, 42, 0.25)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)',
                }}
              >
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#0F172A' }}>Staff Login</h2>
              <p style={{ color: '#64748B' }}>Sign in to access your dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#334155' }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5" style={{ color: '#94A3B8' }} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${errors.email ? '#EF4444' : '#E2E8F0'}`,
                      color: '#0F172A',
                    }}
                    placeholder="Enter your email"
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#F8FAFC';
                      e.target.style.borderColor = errors.email ? '#EF4444' : '#E2E8F0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#334155' }}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5" style={{ color: '#94A3B8' }} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${errors.password ? '#EF4444' : '#E2E8F0'}`,
                      color: '#0F172A',
                    }}
                    placeholder="Enter your password"
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#F8FAFC';
                      e.target.style.borderColor = errors.password ? '#EF4444' : '#E2E8F0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center peer-checked:border-[#2563EB] peer-checked:bg-[#2563EB] group-hover:border-[#94A3B8]"
                      style={{ borderColor: rememberMe ? '#2563EB' : '#CBD5E1', backgroundColor: rememberMe ? '#2563EB' : 'transparent' }}
                    >
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: '#475569' }}>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E2E8F0' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/patient-login"
                  className="group flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                  style={{ color: '#2563EB' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#2563EB'}
                >
                  <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                  Patient Login
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: '#64748B' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#2563EB'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                >
                  Back to Homepage
                </Link>
              </div>
            </div>
          </div>
          
          {/* Bottom decoration */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              © 2026 HMS Healthcare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
