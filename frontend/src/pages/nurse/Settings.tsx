import ChangePasswordForm from '../../components/ui/ChangePasswordForm';
import SecurityInfoCard from '../../components/ui/SecurityInfoCard';

export default function NurseSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ChangePasswordForm />
      <SecurityInfoCard />
    </div>
  );
}
