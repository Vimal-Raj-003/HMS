import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { patientPortalAPI } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface ProfileSetupForm {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  weight: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  allergies?: string;
}

export default function ProfileSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileSetupForm) => {
    setIsLoading(true);
    try {
      // Convert allergies string to array
      const allergiesArray = data.allergies
        ? data.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : [];

      // Update profile - response handled via try/catch (errors throw, success continues)
      await patientPortalAPI.updateProfile({
        ...data,
        weight: parseFloat(data.weight),
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        allergies: allergiesArray,
      });

      // Update the user in auth store with new data
      if (user) {
        setAuth(
          {
            ...user,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
          useAuthStore.getState().token!,
          useAuthStore.getState().refreshToken!
        );
      }

      toast.success('Profile updated successfully!');
      navigate('/patient/book');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-secondary-200 bg-primary-50">
          <h1 className="text-xl font-semibold text-secondary-900">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Please complete your profile to book an appointment. Fields marked with * are mandatory.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className={`input mt-1 ${errors.firstName ? 'input-error' : ''}`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`input mt-1 ${errors.lastName ? 'input-error' : ''}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={`input mt-1 ${errors.email ? 'input-error' : ''}`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  className={`input mt-1 ${errors.dateOfBirth ? 'input-error' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className={`input mt-1 ${errors.gender ? 'input-error' : ''}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="500"
                  {...register('weight', {
                    required: 'Weight is required',
                    min: { value: 1, message: 'Weight must be at least 1 kg' },
                    max: { value: 500, message: 'Weight cannot exceed 500 kg' },
                  })}
                  className={`input mt-1 ${errors.weight ? 'input-error' : ''}`}
                  placeholder="e.g., 70"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">Blood Group</label>
                <select {...register('bloodGroup')} className="input mt-1">
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className={`input mt-1 ${errors.address ? 'input-error' : ''}`}
                  rows={2}
                  placeholder="Street address, Area, Landmark"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="input mt-1"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="input mt-1"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700">Pincode</label>
                  <input
                    type="text"
                    {...register('pincode', {
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Enter a valid 6-digit pincode',
                      },
                    })}
                    className={`input mt-1 ${errors.pincode ? 'input-error' : ''}`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Emergency Contact (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  {...register('emergencyContact')}
                  className="input mt-1"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Emergency Contact Phone
                </label>
                <div className="mt-1 flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-secondary-300 bg-secondary-50 text-secondary-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    {...register('emergencyPhone', {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Enter a valid 10-digit phone number',
                      },
                    })}
                    className={`input rounded-l-none ${errors.emergencyPhone ? 'input-error' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
                {errors.emergencyPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.emergencyPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Medical Information (Optional)
            </h2>
            <div>
              <label className="block text-sm font-medium text-secondary-700">
                Known Allergies
              </label>
              <textarea
                {...register('allergies')}
                className="input mt-1"
                rows={2}
                placeholder="List any known allergies (medications, food, etc.)"
              />
              <p className="mt-1 text-sm text-secondary-500">
                Separate multiple allergies with commas
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-secondary-200">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Saving...' : 'Save & Continue to Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
