import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Calendar, MapPin, Droplet, AlertCircle, Heart, Edit2, Save, X } from 'lucide-react';
import { patientPortalAPI } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  dateOfBirth: Date | string | null;
  gender: string | null;
  weight: number | null;
  bloodGroup: string | null;
  address: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergies?: string[];
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  weight: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string;
}

export default function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const { user, setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await patientPortalAPI.getProfile();
      const profileData = response.data as PatientProfile;
      setProfile(profileData);
      
      // Populate form with existing data
      reset({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        dateOfBirth: profileData.dateOfBirth 
          ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: profileData.gender || '',
        weight: profileData.weight?.toString() || '',
        bloodGroup: profileData.bloodGroup || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        pincode: profileData.pincode || '',
        emergencyContact: profileData.emergencyContact || '',
        emergencyPhone: profileData.emergencyPhone || '',
        allergies: profileData.allergies?.join(', ') || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const allergiesArray = data.allergies
        ? data.allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : [];

      const updateData = {
        ...data,
        weight: data.weight ? parseFloat(data.weight) : null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
        allergies: allergiesArray,
      };

      await patientPortalAPI.updateProfile(updateData);
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      
      // Update auth store user info
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
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        dateOfBirth: profile.dateOfBirth 
          ? new Date(profile.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: profile.gender || '',
        weight: profile.weight?.toString() || '',
        bloodGroup: profile.bloodGroup || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        allergies: profile.allergies?.join(', ') || '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if profile is empty (new user)
  const isEmptyProfile = !profile?.dateOfBirth && !profile?.gender && !profile?.weight;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Edit Button */}
      <div className="flex justify-end">
        {!editing && !isEmptyProfile && (
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
          {/* Personal Information */}
          <div className="p-6 border-b border-secondary-100">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
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
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.firstName ? 'input-error' : ''}`}
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
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.lastName ? 'input-error' : ''}`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  <Mail className="w-4 h-4 inline mr-1" />
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
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.email ? 'input-error' : ''}`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile?.phone || ''}
                  disabled
                  className="input mt-1 bg-secondary-50"
                />
                <p className="mt-1 text-xs text-secondary-400">Phone number cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.dateOfBirth ? 'input-error' : ''}`}
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
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.gender ? 'input-error' : ''}`}
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
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.weight ? 'input-error' : ''}`}
                  placeholder="e.g., 70"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  <Droplet className="w-4 h-4 inline mr-1" />
                  Blood Group
                </label>
                <select
                  {...register('bloodGroup')}
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' }`}
                >
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
          <div className="p-6 border-b border-secondary-100">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Address Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.address ? 'input-error' : ''}`}
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
                    disabled={!editing && !isEmptyProfile}
                    className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' }`}
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    disabled={!editing && !isEmptyProfile}
                    className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' }`}
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
                    disabled={!editing && !isEmptyProfile}
                    className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.pincode ? 'input-error' : ''}`}
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
          <div className="p-6 border-b border-secondary-100">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  {...register('emergencyContact')}
                  disabled={!editing && !isEmptyProfile}
                  className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' }`}
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
                    disabled={!editing && !isEmptyProfile}
                    className={`input rounded-l-none ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' } ${errors.emergencyPhone ? 'input-error' : ''}`}
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
          <div className="p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              Medical Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-secondary-700">
                Known Allergies
              </label>
              <textarea
                {...register('allergies')}
                disabled={!editing && !isEmptyProfile}
                className={`input mt-1 ${(editing || isEmptyProfile) ? '' : 'bg-secondary-50' }`}
                rows={2}
                placeholder="List any known allergies (medications, food, etc.)"
              />
              <p className="mt-1 text-sm text-secondary-500">
                Separate multiple allergies with commas
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {(editing || isEmptyProfile) && (
            <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200 flex items-center justify-end gap-3">
              {!isEmptyProfile && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
