import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Bell,
  Shield,
  AlertCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import { useAuthStore } from '../../store/auth.store';

export default function PatientSettingsPage() {
  const { user } = useAuthStore();

  // Notification preferences (local state for now)
  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    labReportReady: true,
    prescriptionUpdates: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Information */}
      <CollapsibleCard
        title="Account Information"
        subtitle="Your account details"
        icon={<User className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={false}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            View your account details
          </span>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
              <User className="w-5 h-5 text-secondary-500 dark:text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-secondary-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
              <Phone className="w-5 h-5 text-secondary-500 dark:text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-secondary-500 dark:text-gray-400">Mobile Number</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                  {user?.phone || 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700 sm:col-span-2">
              <Mail className="w-5 h-5 text-secondary-500 dark:text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-secondary-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                  {user?.email || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/patient/profile"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Edit Profile
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </CollapsibleCard>

      {/* Notification Preferences */}
      <CollapsibleCard
        title="Notification Preferences"
        subtitle="Manage how you receive updates"
        icon={<Bell className="w-5 h-5 text-purple-600" />}
        iconBgColor="bg-purple-100"
        defaultCollapsed={false}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            Configure your notification settings
          </span>
        }
      >
        <div className="space-y-3">
          {[
            {
              key: 'appointmentReminders' as const,
              label: 'Appointment Reminders',
              description: 'Get SMS reminders before your appointments',
              icon: Bell,
            },
            {
              key: 'labReportReady' as const,
              label: 'Lab Report Alerts',
              description: 'Get notified when your lab reports are ready',
              icon: AlertCircle,
            },
            {
              key: 'prescriptionUpdates' as const,
              label: 'Prescription Updates',
              description: 'Get notified about prescription status changes',
              icon: Smartphone,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-secondary-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                    {item.label}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[item.key]
                    ? 'bg-primary-600'
                    : 'bg-secondary-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Security Info - OTP specific */}
      <CollapsibleCard
        title="Security Information"
        subtitle="Account security details"
        icon={<Shield className="w-5 h-5 text-green-600" />}
        iconBgColor="bg-green-100"
        defaultCollapsed={true}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            Tips to keep your account secure
          </span>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">OTP-Based Login</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Your account is secured with OTP verification sent to your registered mobile number.
                Each OTP is valid for 5 minutes and can only be used once.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Never Share Your OTP</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                HMS staff will never ask for your OTP. If someone asks for your OTP,
                do not share it and report it to the hospital immediately.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
