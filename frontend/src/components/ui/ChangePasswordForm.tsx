import { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Key,
} from 'lucide-react';
import CollapsibleCard from './CollapsibleCard';
import { authAPI } from '../../lib/api';

export default function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('New password does not meet the requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CollapsibleCard
      title="Change Password"
      subtitle="Update your account password"
      icon={<Key className="w-5 h-5 text-blue-600" />}
      iconBgColor="bg-blue-100"
      defaultCollapsed={false}
      collapsedContent={
        <span className="text-sm text-secondary-600">
          Secure your account with a strong password
        </span>
      }
    >
      <form onSubmit={handlePasswordChange} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-secondary-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-secondary-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                ) : (
                  <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-secondary-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-secondary-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                ) : (
                  <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-secondary-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300 dark:border-red-600'
                    : confirmPassword && passwordsMatch
                    ? 'border-green-300 dark:border-green-600'
                    : 'border-secondary-300 dark:border-gray-600'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                ) : (
                  <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-1 text-sm text-green-600">Passwords match</p>
            )}
          </div>
        </div>

        {/* Password Requirements */}
        <div className="p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
          <p className="text-sm font-medium text-secondary-700 dark:text-gray-300 mb-3">
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-secondary-300 dark:border-gray-600" />
              )}
              <span className={`text-sm ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-gray-400'}`}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasUpperCase ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-secondary-300 dark:border-gray-600" />
              )}
              <span className={`text-sm ${hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-gray-400'}`}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasLowerCase ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-secondary-300 dark:border-gray-600" />
              )}
              <span className={`text-sm ${hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-gray-400'}`}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-secondary-300 dark:border-gray-600" />
              )}
              <span className={`text-sm ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-gray-400'}`}>
                One number
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !passwordsMatch || !hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </form>
    </CollapsibleCard>
  );
}
