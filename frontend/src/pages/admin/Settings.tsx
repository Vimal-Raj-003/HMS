import { useState } from 'react';
import {
  Sun,
  Moon,
  Shield,
  Stethoscope,
  Activity,
  Pill,
  FlaskConical,
  ClipboardList,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import ChangePasswordForm from '../../components/ui/ChangePasswordForm';
import SecurityInfoCard from '../../components/ui/SecurityInfoCard';
import { useAuthStore } from '../../store/auth.store';

const rolePermissions = [
  {
    role: 'Admin',
    icon: Shield,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
    permissions: [
      'Full system access',
      'Staff management (CRUD)',
      'Patient registration',
      'Appointments management',
      'Queue management',
      'Billing & payments',
      'Reports & analytics',
      'System settings',
    ],
  },
  {
    role: 'Doctor',
    icon: Stethoscope,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
    permissions: [
      'View own dashboard & schedule',
      'Manage consultations',
      'Write prescriptions',
      'Order lab tests',
      'View patient records',
      'Accept/reject appointments',
    ],
  },
  {
    role: 'Nurse',
    icon: Activity,
    color: 'bg-green-100 text-green-600',
    borderColor: 'border-green-200',
    permissions: [
      'View nurse dashboard',
      'Search patients',
      'Record vitals',
      'Update queue status',
      'View patient history',
    ],
  },
  {
    role: 'Pharmacist',
    icon: Pill,
    color: 'bg-teal-100 text-teal-600',
    borderColor: 'border-teal-200',
    permissions: [
      'View pharmacy dashboard',
      'View pending prescriptions',
      'Dispense medicines',
      'Manage inventory',
      'Generate pharmacy bills',
      'Manage expenses',
      'View pharmacy reports',
    ],
  },
  {
    role: 'Lab Technician',
    icon: FlaskConical,
    color: 'bg-orange-100 text-orange-600',
    borderColor: 'border-orange-200',
    permissions: [
      'View lab dashboard',
      'Process lab orders',
      'Collect samples',
      'Enter test results',
      'Manage test catalog',
    ],
  },
  {
    role: 'Receptionist',
    icon: ClipboardList,
    color: 'bg-pink-100 text-pink-600',
    borderColor: 'border-pink-200',
    permissions: [
      'Patient registration',
      'Appointment booking',
      'Queue management',
      'Billing access',
      'View dashboard',
    ],
  },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  // Receptionist only sees Change Password + Security Info
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <ChangePasswordForm />
        <SecurityInfoCard />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Theme Settings */}
      <CollapsibleCard
        title="Appearance"
        subtitle="Theme and display preferences"
        icon={<Sun className="w-5 h-5 text-amber-600" />}
        iconBgColor="bg-amber-100"
        defaultCollapsed={false}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            Current theme: <span className="font-medium capitalize">{theme}</span>
          </span>
        }
      >
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-secondary-900 dark:text-gray-100">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-sm text-secondary-500 dark:text-gray-400">
                  {theme === 'dark'
                    ? 'Using dark color scheme for reduced eye strain'
                    : 'Using light color scheme for better readability'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-secondary-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </span>
            </button>
          </div>

          {/* Theme Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                theme === 'light'
                  ? 'border-primary-500 bg-white shadow-md'
                  : 'border-secondary-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-secondary-900 dark:text-gray-100">Light Theme</span>
                {theme === 'light' && <Check className="w-4 h-4 text-primary-600 ml-auto" />}
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-secondary-200 rounded"></div>
                <div className="h-2 w-1/2 bg-secondary-100 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-primary-100 rounded"></div>
                  <div className="h-6 w-16 bg-green-100 rounded"></div>
                </div>
              </div>
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                theme === 'dark'
                  ? 'border-primary-500 bg-gray-800 shadow-md'
                  : 'border-secondary-200 bg-gray-800 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-gray-100">Dark Theme</span>
                {theme === 'dark' && <Check className="w-4 h-4 text-primary-400 ml-auto" />}
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-gray-600 rounded"></div>
                <div className="h-2 w-1/2 bg-gray-700 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-primary-900/50 rounded"></div>
                  <div className="h-6 w-16 bg-green-900/50 rounded"></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </CollapsibleCard>

      {/* Hospital Info */}
      <CollapsibleCard
        title="Hospital Information"
        subtitle="System configuration details"
        icon={<Building2 className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={true}
        collapsedContent={
          <span className="text-sm text-secondary-600">HMS Healthcare System</span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Hospital Name</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">HMS Healthcare System</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Contact</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">+1 (800) 123-4567</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">admin@hms.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Address</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">123 Healthcare Ave, Medical District</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Version</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">HMS v2.0.0</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-gray-800 border border-secondary-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-secondary-500 dark:text-gray-400">Security</p>
              <p className="font-medium text-secondary-900 dark:text-gray-100">HIPAA Compliant, SSL Encrypted</p>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Role-Based Permissions */}
      <CollapsibleCard
        title="Role-Based Access Control"
        subtitle="Permissions by role"
        icon={<Lock className="w-5 h-5 text-red-600" />}
        iconBgColor="bg-red-100"
        defaultCollapsed={false}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            {rolePermissions.length} roles configured
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolePermissions.map((role) => {
            const Icon = role.icon;
            const isExpanded = expandedRole === role.role;
            return (
              <div
                key={role.role}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${role.borderColor} ${
                  isExpanded ? 'shadow-md' : 'hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedRole(isExpanded ? null : role.role)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 dark:text-gray-100">{role.role}</p>
                    <p className="text-xs text-secondary-500 dark:text-gray-400">
                      {role.permissions.length} permissions
                    </p>
                  </div>
                  {isExpanded ? (
                    <EyeOff className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-secondary-100 dark:border-gray-700">
                    <ul className="mt-3 space-y-2">
                      {role.permissions.map((perm, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-secondary-700 dark:text-gray-300">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleCard>

      {/* Change Password */}
      <ChangePasswordForm />

      {/* Security Info */}
      <SecurityInfoCard />
    </div>
  );
}
