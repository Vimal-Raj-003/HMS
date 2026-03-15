import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
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

  const onSendOTP = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      await authAPI.sendOTP(data.mobileNumber);
      setMobileNumber(data.mobileNumber);
      otpForm.setValue('mobileNumber', data.mobileNumber);
      setStep('otp');
      startResendTimer();
      toast.success('OTP sent successfully!');
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

      setAuth(user, accessToken, refreshToken);
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
      await authAPI.resendOTP(mobileNumber);
      startResendTimer();
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <h2 className="text-center text-2xl font-bold text-secondary-900">
          Patient Login
        </h2>
        <p className="mt-2 text-center text-sm text-secondary-600">
          Sign in with your mobile number
        </p>

        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(onSendOTP)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-secondary-700">
                Mobile Number
              </label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-secondary-300 bg-secondary-50 text-secondary-500 text-sm">
                  +91
                </span>
                <input
                  id="mobileNumber"
                  type="tel"
                  {...phoneForm.register('mobileNumber', {
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit mobile number',
                    },
                  })}
                  className={`input rounded-l-none ${phoneForm.formState.errors.mobileNumber ? 'input-error' : ''}`}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {phoneForm.formState.errors.mobileNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {phoneForm.formState.errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Staff Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700">
                Enter OTP sent to {mobileNumber}
              </label>
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
                className={`input mt-1 text-center text-2xl tracking-widest ${otpForm.formState.errors.otp ? 'input-error' : ''}`}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              {otpForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-600">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="font-medium text-secondary-600 hover:text-secondary-500"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={onResendOTP}
                disabled={resendTimer > 0 || isLoading}
                className={`font-medium ${resendTimer > 0 ? 'text-secondary-400' : 'text-primary-600 hover:text-primary-500'}`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
