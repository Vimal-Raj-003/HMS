import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Heart, Phone, ArrowRight, Shield, Calendar, Lock, User, Clock, FileText } from 'lucide-react';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface OTPForm {
  mobileNumber: string;
}

interface VerifyOTPForm {
  mobileNumber: string;
  otp: string;
}

export default function PatientLogin() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const phoneForm = useForm<OTPForm>({
    defaultValues: { mobileNumber: '' },
  });

  const otpForm = useForm<VerifyOTPForm>({
    defaultValues: { mobileNumber: '', otp: '' },
  });

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Normalize phone: strip +91, 91, 0 prefix → always 10 digits
  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+91') && cleaned.length === 13) return cleaned.slice(3);
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
    if (cleaned.startsWith('0') && cleaned.length === 11) return cleaned.slice(1);
    return cleaned;
  };

  const onSendOTP = async (data: OTPForm) => {
    const mobile = normalizePhone(data.mobileNumber);
    if (!/^[0-9]{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(mobile);
      const responseData = response.data as any;
      setMobileNumber(mobile);
      otpForm.setValue('mobileNumber', mobile);
      setStep('otp');
      startResendTimer();

      // Show OTP in toast if returned by backend (development mode)
      if (responseData?.otp) {
        toast.success(`OTP: ${responseData.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your mobile number!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async (data: VerifyOTPForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(data.mobileNumber, data.otp);
      const { user, accessToken, refreshToken, isNewUser } = response.data;

      // Patient OTP login — always session-scoped (no "Remember Me")
      setAuth(user, accessToken, refreshToken, false);
      localStorage.setItem('auth-token', accessToken);

      toast.success('Login successful!');

      if (isNewUser) {
        navigate('/patient/profile/setup');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const response = await authAPI.resendOTP(mobileNumber);
      const responseData = response.data as any;
      startResendTimer();

      if (responseData?.otp) {
        toast.success(`OTP: ${responseData.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP resent to your mobile number!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-login-page-load">
      {/* ============================================
          LEFT SIDE - FUTURISTIC BACKGROUND WITH ANIMATIONS
          Background: #0F172A → #14B8A6 → #2563EB
          ============================================ */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #14B8A6 50%, #2563EB 100%)',
        }}
      >
        {/* Animated Background Layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs with enhanced animations */}
          <div 
            className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse-slow"
            style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)' }}
          ></div>
          <div 
            className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl animate-float-orb"
            style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full blur-3xl animate-pulse-slow-alt"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
          ></div>
          <div 
            className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] rounded-full blur-3xl animate-depth-pulse"
            style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }}
          ></div>
          
          {/* Enhanced dot grid pattern */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]"
          ></div>
          
          {/* Digital grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="digital-grid-patient" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(20, 184, 166, 0.5)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#digital-grid-patient)"/>
          </svg>
          
          {/* Healthcare-themed SVG Pattern - Medical Crosses */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="patient-medical-cross" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <g fill="rgba(255,255,255,0.8)" transform="translate(42, 42)">
                  <rect x="4" y="0" width="8" height="16" rx="2"/>
                  <rect x="0" y="4" width="16" height="8" rx="2"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#patient-medical-cross)"/>
          </svg>
          
          {/* Enhanced ECG Line Animation */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="patient-ecg-line" x="0" y="0" width="300" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M0,40 L40,40 L50,40 L60,15 L70,65 L80,30 L90,50 L100,40 L150,40 L160,40 L170,20 L180,60 L190,40 L300,40"
                  fill="none"
                  stroke="url(#ecg-gradient-teal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="ecg-gradient-teal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(20, 184, 166, 0.3)" />
                    <stop offset="50%" stopColor="rgba(20, 184, 166, 0.8)" />
                    <stop offset="100%" stopColor="rgba(37, 99, 235, 0.3)" />
                  </linearGradient>
                </defs>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#patient-ecg-line)" className="animate-ecg-slide"/>
          </svg>
          
          {/* DNA Helix Pattern */}
          <svg className="absolute top-0 left-0 w-[300px] h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 400">
            <g>
              {[...Array(8)].map((_, i) => (
                <g key={i} transform={`translate(50, ${i * 50 + 25})`}>
                  <ellipse cx="0" cy="0" rx="30" ry="8" fill="none" stroke="rgba(20, 184, 166, 0.6)" strokeWidth="1.5"/>
                  <circle cx="-20" cy="0" r="4" fill="rgba(20, 184, 166, 0.4)"/>
                  <circle cx="20" cy="0" r="4" fill="rgba(37, 99, 235, 0.4)"/>
                </g>
              ))}
            </g>
          </svg>
          
          {/* Floating particles with enhanced effects */}
          <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full animate-float-particle" style={{ backgroundColor: 'rgba(45, 212, 191, 0.5)', boxShadow: '0 0 20px rgba(45, 212, 191, 0.3)' }}></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full animate-float-particle-delayed" style={{ backgroundColor: 'rgba(96, 165, 250, 0.5)', boxShadow: '0 0 20px rgba(96, 165, 250, 0.3)' }}></div>
          <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 rounded-full animate-float-particle-slow" style={{ backgroundColor: 'rgba(52, 211, 153, 0.4)', boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)' }}></div>
          <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full animate-float-particle" style={{ backgroundColor: 'rgba(34, 211, 238, 0.4)', boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)', animationDelay: '3s' }}></div>
          <div className="absolute bottom-1/4 left-1/5 w-2 h-2 rounded-full animate-float-particle-delayed" style={{ backgroundColor: 'rgba(153, 246, 228, 0.3)' }}></div>
          
          {/* Pulse monitoring circles */}
          <div className="absolute top-1/3 left-1/4 w-20 h-20 rounded-full animate-pulse-slow" style={{ border: '1px solid rgba(45, 212, 191, 0.2)' }}></div>
          <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full animate-pulse-slow-alt" style={{ border: '1px solid rgba(96, 165, 250, 0.1)' }}></div>
        </div>

        {/* Content with entrance animations */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20 animate-login-content">
          {/* Logo with heartbeat animation */}
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #14B8A6 0%, #2563EB 100%)',
                boxShadow: '0 20px 40px rgba(20, 184, 166, 0.4)',
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
            Your Health,<br />
            <span 
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #2DD4BF, #22D3EE, #60A5FA)',
              }}
            >
              Our Priority
            </span>
          </h1>
          
          <p className="text-lg xl:text-xl text-slate-300 mb-10 max-w-lg leading-relaxed">
            Access your medical records, book appointments, and manage your healthcare journey with ease.
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
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.3), rgba(20, 184, 166, 0.2))',
                  border: '1px solid rgba(45, 212, 191, 0.2)',
                }}
              >
                <Calendar className="w-7 h-7" style={{ color: '#2DD4BF' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Easy Booking</h3>
                <p className="text-sm text-slate-400">Book appointments in seconds</p>
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
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(37, 99, 235, 0.2))',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                }}
              >
                <Shield className="w-7 h-7" style={{ color: '#60A5FA' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Secure Access</h3>
                <p className="text-sm text-slate-400">Your data is always protected</p>
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
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                }}
              >
                <FileText className="w-7 h-7" style={{ color: '#34D399' }} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Medical Records</h3>
                <p className="text-sm text-slate-400">Access your health history</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(17, 94, 89, 0.3), transparent)',
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
          background: 'linear-gradient(135deg, #F8FAFC 0%, rgba(240, 253, 250, 0.3) 50%, #F1F5F9 100%)',
        }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(204, 251, 241, 0.4), transparent)' }}
          ></div>
          <div 
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.3), transparent)' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'linear-gradient(90deg, rgba(240, 253, 250, 0.2), rgba(239, 246, 255, 0.2))' }}
          ></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-login-panel">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #14B8A6, #2563EB)',
                boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
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
                  background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
                  boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
                }}
              >
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#0F172A' }}>Patient Login</h2>
              <p style={{ color: '#64748B' }}>Sign in with your mobile number</p>
            </div>

            {step === 'phone' ? (
              <form onSubmit={phoneForm.handleSubmit(onSendOTP)} className="space-y-5">
                <div>
                  <label 
                    htmlFor="mobileNumber" 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#334155' }}
                  >
                    Mobile Number
                  </label>
                  <div className="relative flex">
                    <span 
                      className="inline-flex items-center px-4 rounded-l-xl text-sm font-medium"
                      style={{ 
                        border: '1px solid #E2E8F0',
                        borderRight: 'none',
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                      }}
                    >
                      +91
                    </span>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5" style={{ color: '#94A3B8' }} />
                      </div>
                      <input
                        id="mobileNumber"
                        type="tel"
                        {...phoneForm.register('mobileNumber', {
                          required: 'Mobile number is required',
                          validate: (value) => {
                            const cleaned = value.replace(/[\s\-()]/g, '');
                            // Accept: 10 digits, or with +91/91/0 prefix
                            if (/^[0-9]{10}$/.test(cleaned)) return true;
                            if (/^\+91[0-9]{10}$/.test(cleaned)) return true;
                            if (/^91[0-9]{10}$/.test(cleaned)) return true;
                            if (/^0[0-9]{10}$/.test(cleaned)) return true;
                            return 'Enter a valid 10-digit mobile number';
                          },
                        })}
                        className="w-full pl-12 pr-4 py-3.5 rounded-r-xl text-sm transition-all duration-200 focus:outline-none"
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: `1px solid ${phoneForm.formState.errors.mobileNumber ? '#EF4444' : '#E2E8F0'}`,
                          color: '#0F172A',
                        }}
                        placeholder="9876543210"
                        maxLength={13}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = '#FFFFFF';
                          e.target.style.borderColor = '#14B8A6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = '#F8FAFC';
                          e.target.style.borderColor = phoneForm.formState.errors.mobileNumber ? '#EF4444' : '#E2E8F0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  {phoneForm.formState.errors.mobileNumber && (
                    <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
                      {phoneForm.formState.errors.mobileNumber.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(20, 184, 166, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(20, 184, 166, 0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-5">
                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#334155' }}
                  >
                    Enter OTP sent to {mobileNumber}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5" style={{ color: '#94A3B8' }} />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      {...otpForm.register('otp', {
                        required: 'OTP is required',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Enter a valid 6-digit OTP',
                        },
                      })}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-center text-2xl tracking-widest transition-all duration-200 focus:outline-none"
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: `1px solid ${otpForm.formState.errors.otp ? '#EF4444' : '#E2E8F0'}`,
                        color: '#0F172A',
                      }}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#FFFFFF';
                        e.target.style.borderColor = '#14B8A6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#F8FAFC';
                        e.target.style.borderColor = otpForm.formState.errors.otp ? '#EF4444' : '#E2E8F0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="mt-2 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#EF4444' }}></span>
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(20, 184, 166, 0.35)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(20, 184, 166, 0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="flex items-center gap-1 transition-colors group"
                    style={{ color: '#64748B' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                  >
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={resendTimer > 0 || isLoading}
                    className="font-medium transition-colors"
                    style={{ 
                      color: resendTimer > 0 ? '#94A3B8' : '#14B8A6',
                      cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (resendTimer === 0 && !isLoading) {
                        e.currentTarget.style.color = '#0D9488';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (resendTimer === 0) {
                        e.currentTarget.style.color = '#14B8A6';
                      }
                    }}
                  >
                    {resendTimer > 0 ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Footer Links */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E2E8F0' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/login"
                  className="group flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                  style={{ color: '#14B8A6' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0D9488'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#14B8A6'}
                >
                  <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                  Staff Login
                </Link>
                <Link
                  to="/"
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: '#64748B' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#14B8A6'}
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
