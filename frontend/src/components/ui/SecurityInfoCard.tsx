import { Shield, AlertCircle } from 'lucide-react';
import CollapsibleCard from './CollapsibleCard';

export default function SecurityInfoCard() {
  return (
    <CollapsibleCard
      title="Security Information"
      subtitle="Account security best practices"
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
            <p className="font-medium text-blue-800 dark:text-blue-300">Password Security</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Use a strong, unique password that you don't use on other websites.
              Change your password regularly to keep your account secure.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Never Share Your Password</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              HMS staff will never ask for your password. If someone asks for your password,
              report it to your administrator immediately.
            </p>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
