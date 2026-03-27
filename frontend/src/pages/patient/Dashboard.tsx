import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Plus,
  Clock,
  Video,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Activity,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import StatCard from '../../components/ui/StatCard';

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: string;
  type: string;
  doctorUnavailable?: boolean;
  unavailabilityReason?: string | null;
}

const getStatusBadge = (status: string) => {
  const statusStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    PENDING_APPROVAL: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' },
    SCHEDULED: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700', border: 'border-blue-200', icon: '📅' },
    CONFIRMED: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700', border: 'border-green-200', icon: '✅' },
    IN_PROGRESS: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700', border: 'border-purple-200', icon: '🏥' },
    COMPLETED: { bg: 'bg-gray-50 dark:bg-gray-900/30', text: 'text-gray-700', border: 'border-gray-200', icon: '✔️' },
    CANCELLED: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700', border: 'border-red-200', icon: '❌' },
    REJECTED: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700', border: 'border-red-200', icon: '🚫' },
    NO_SHOW: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700', border: 'border-orange-200', icon: '⚠️' },
  };

  const statusLabels: Record<string, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
    NO_SHOW: 'No Show',
  };

  const style = statusStyles[status] || { bg: 'bg-gray-50 dark:bg-gray-900/30', text: 'text-gray-700', border: 'border-gray-200', icon: '' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${style.bg} ${style.text} ${style.border}`}>
      <span>{style.icon}</span>
      {statusLabels[status] || status}
    </span>
  );
};

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, totalRes] = await Promise.all([
        patientPortalAPI.getAppointmentsUpcoming(),
        patientPortalAPI.getTotalAppointments(),
      ]);
      setUpcomingAppointments(appointmentsRes.data);
      setTotalAppointments(totalRes.data.count);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Dashboard Cards - Total Appointments, Patient ID, and Book Appointment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Appointments"
          value={totalAppointments}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
          subtitle="All booked appointments"
        />
        <StatCard
          title="Patient ID"
          value={user?.patientNumber || 'N/A'}
          icon={<User className="w-6 h-6" />}
          color="teal"
          subtitle="Unique patient identifier"
        />
        <StatCard
          title="Book Appointment"
          value="Schedule"
          icon={<Plus className="w-6 h-6" />}
          color="green"
          subtitle="Book a new appointment"
          onClick={() => navigate('/patient/book')}
        />
      </div>

      {/* Upcoming Appointments - Collapsible */}
      <CollapsibleCard
        title="Upcoming Appointments"
        subtitle="Your scheduled visits"
        icon={<Calendar className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={false}
        collapsedContent={
          <div className="flex items-center gap-4 text-sm text-secondary-600">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}
            </span>
            {upcomingAppointments.length > 0 && upcomingAppointments[0] && (
              <>
                <span className="text-secondary-400">•</span>
                <span>
                  Next: {upcomingAppointments[0].doctorName} on {upcomingAppointments[0].date}
                </span>
              </>
            )}
          </div>
        }
      >
        <div className="p-5">
          {upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-sm font-medium text-secondary-700">No upcoming appointments</p>
              <p className="text-xs text-secondary-500 mt-1">Schedule your next visit</p>
              <Link to="/patient/book" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-secondary-50 to-transparent dark:from-gray-800 dark:to-transparent rounded-xl border border-secondary-100 dark:border-gray-700 hover:border-primary-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{appointment.doctorName}</p>
                        {getStatusBadge(appointment.status)}
                        {appointment.doctorUnavailable && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3" />
                            Doctor Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{appointment.specialization}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          {appointment.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          {appointment.time}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {appointment.type === 'ONLINE' ? (
                            <Video className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Activity className="w-4 h-4 text-green-500" />
                          )}
                          {appointment.type || 'In-Person'}
                        </span>
                      </div>
                      {appointment.doctorUnavailable && appointment.unavailabilityReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs text-red-600">
                            <span className="font-medium">Reason:</span> {appointment.unavailabilityReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Quick Actions - Collapsible */}
      <CollapsibleCard
        title="Quick Actions"
        subtitle="Frequently used features"
        icon={<Activity className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/patient/book"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </Link>
            <Link
              to="/patient/prescriptions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              to="/patient/lab-reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Lab Reports
            </Link>
            <Link
              to="/patient/records"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-healthcare-50 text-healthcare-700 rounded-lg hover:bg-healthcare-100 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Medical Records
            </Link>
          </div>
        }
      >
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/patient/book"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors duration-200">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">Book Appointment</span>
            </Link>

            <Link
              to="/patient/prescriptions"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors duration-200">
                <ClipboardList className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">Prescriptions</span>
            </Link>

            <Link
              to="/patient/lab-reports"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                <FlaskConical className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-700">Lab Reports</span>
            </Link>

            <Link
              to="/patient/records"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-healthcare-50 to-healthcare-100/50 rounded-xl border border-healthcare-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-healthcare-100 flex items-center justify-center mb-3 group-hover:bg-healthcare-200 transition-colors duration-200">
                <FileText className="w-6 h-6 text-healthcare-600" />
              </div>
              <span className="text-sm font-medium text-healthcare-700">Medical Records</span>
            </Link>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
