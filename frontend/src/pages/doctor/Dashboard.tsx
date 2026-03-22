import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FlaskConical,
  Calendar,
  Stethoscope,
  FileText,
  ClipboardList,
  X,
  Phone,
  User,
  Droplet,
  CalendarDays,
  Clock4,
  FileTextIcon,
} from 'lucide-react';
import { doctorAPI } from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import { SkeletonDashboard, Spinner } from '../../components/ui/Skeleton';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface DashboardStats {
  todayTotal: number;
  completed: number;
  remaining: number;
  unattended: number;
  criticalAlerts: number;
  pendingLabReviews: number;
  nextAppointment: {
    id: string;
    time: string;
    patientName: string;
    type: string;
  } | null;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  type: string;
  chiefComplaint: string | null;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    dateOfBirth: string;
    gender: string;
    weight: number | null;
    bloodGroup: string | null;
    address: string | null;
  };
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to check if an appointment is in the future
  const isFutureAppointment = (appointment: Appointment): boolean => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const currentDate = istNow.toISOString().split('T')[0];
    const currentTime = istNow.toTimeString().slice(0, 5);

    const appointmentDate = appointment.appointmentDate;
    const appointmentTime = appointment.startTime;

    // If appointment date is in the future, it's valid
    if (appointmentDate > currentDate) {
      return true;
    }
    // If appointment date is today, check the time
    if (appointmentDate === currentDate && appointmentTime >= currentTime) {
      return true;
    }
    // Otherwise, it's in the past
    return false;
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        doctorAPI.getDashboardStats(),
        doctorAPI.getUpcomingAppointments(),
      ]);
      setStats(statsRes.data);
      // Frontend validation: filter out any past appointments as a safety measure
      const futureAppointments = (appointmentsRes.data || []).filter(isFutureAppointment);
      setUpcomingAppointments(futureAppointments);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    setActionLoading(true);
    try {
      await doctorAPI.acceptAppointment(appointmentId);
      await fetchDashboardData();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to accept appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = () => {
    setShowModal(false);
    setShowRejectModal(true);
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointment || !rejectReason.trim()) return;
    
    setActionLoading(true);
    try {
      await doctorAPI.rejectAppointment(selectedAppointment.id, rejectReason);
      await fetchDashboardData();
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to reject appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleClick = () => {
    setShowModal(false);
    setShowRescheduleModal(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(tomorrow.toISOString().split('T')[0]);
    setRescheduleTime('');
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
    
    setActionLoading(true);
    try {
      await doctorAPI.rescheduleAppointment(selectedAppointment.id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleTime,
        reason: rescheduleReason,
      });
      await fetchDashboardData();
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      CONFIRMED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400';
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Quick Action */}
      <div className="flex justify-end">
        <Link to="/doctor/consultation" className="btn-primary inline-flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          <span>Start Consultation</span>
        </Link>
      </div>

      {/* Stats Cards - Updated metrics for patient workload */}
      <div className="hms-stats-grid">
        <StatCard
          title="Total Patients"
          value={stats?.todayTotal || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="Total appointments"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          subtitle="Consultations done"
        />
        <StatCard
          title="Remaining"
          value={stats?.remaining || 0}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
          subtitle=""
        />
        <StatCard
          title="Unattended"
          value={stats?.unattended || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          subtitle="Missed appointments"
        />
        <StatCard
          title="Lab Reviews"
          value={stats?.pendingLabReviews || 0}
          icon={<FlaskConical className="w-6 h-6" />}
          color="purple"
          subtitle="Pending review"
        />
      </div>

      {/* Upcoming Appointments Section - Collapsible */}
      <CollapsibleCard
        title="Upcoming Appointments"
        subtitle="Your upcoming appointments"
        icon={<Calendar className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={false}
        collapsedContent={
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}
            </span>
            {upcomingAppointments.length > 0 && (
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            )}
            {upcomingAppointments[0] && (
              <span>
                Next: {upcomingAppointments[0].patient.firstName} {upcomingAppointments[0].patient.lastName} at {upcomingAppointments[0].startTime}
              </span>
            )}
          </div>
        }
      >
        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center py-12 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No upcoming appointments</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your schedule is clear</p>
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl p-4 hover:shadow-md transition-all duration-200 border"
                  style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">
                          {appointment.patient.firstName[0]}
                          {appointment.patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {calculateAge(appointment.patient.dateOfBirth)} yrs, {appointment.patient.gender}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <CalendarDays className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <Clock4 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span>{appointment.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <FileTextIcon className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      <span>{appointment.type}</span>
                    </div>
                    {appointment.chiefComplaint && (
                      <p className="line-clamp-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-medium">Reason:</span> {appointment.chiefComplaint}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleViewAppointment(appointment)}
                    className="btn-primary btn-sm w-full"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* Quick Actions - Collapsible */}
      <CollapsibleCard
        title="Quick Actions"
        subtitle="Frequently used operations"
        icon={<Stethoscope className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/doctor/queue"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              View Queue
            </Link>
            <Link
              to="/doctor/schedule"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              My Schedule
            </Link>
            <Link
              to="/doctor/prescriptions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Prescriptions
            </Link>
            <Link
              to="/doctor/consultation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-healthcare-50 text-healthcare-700 rounded-lg hover:bg-healthcare-100 transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              Consultation
            </Link>
          </div>
        }
      >
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Link
              to="/doctor/queue"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors duration-200">
                <ClipboardList className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-primary-700">View Queue</span>
            </Link>

            <Link
              to="/doctor/schedule"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors duration-200">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">My Schedule</span>
            </Link>

            <Link
              to="/doctor/prescriptions"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-700">Prescriptions</span>
            </Link>

            <Link
              to="/doctor/consultation"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-healthcare-50 to-healthcare-100/50 rounded-xl border border-healthcare-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-healthcare-100 flex items-center justify-center mb-3 group-hover:bg-healthcare-200 transition-colors duration-200">
                <Stethoscope className="w-6 h-6 text-healthcare-600" />
              </div>
              <span className="text-sm font-medium text-healthcare-700">Consultation</span>
            </Link>
          </div>
        </div>
      </CollapsibleCard>

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity backdrop-blur-sm"
              style={{ backgroundColor: 'var(--color-dialog-overlay)' }}
              onClick={() => setShowModal(false)}
            />

            <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform shadow-modal rounded-2xl animate-scale-in" style={{ backgroundColor: 'var(--color-dialog-bg)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Appointment Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 transition-colors duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Information */}
              <div className="bg-secondary-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500">Name</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500">Phone</p>
                      <p className="text-sm font-medium text-secondary-900">{selectedAppointment.patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500">Age / Gender</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {calculateAge(selectedAppointment.patient.dateOfBirth)} yrs, {selectedAppointment.patient.gender}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500">Blood Group</p>
                      <p className="text-sm font-medium text-secondary-900">{selectedAppointment.patient.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 mb-6">
                <h4 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">Appointment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-primary-600">Date & Time</p>
                    <p className="text-sm font-medium text-secondary-900">
                      {formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.startTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Type</p>
                    <p className="text-sm font-medium text-secondary-900">{selectedAppointment.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
                {selectedAppointment.chiefComplaint && (
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <p className="text-xs text-primary-600">Chief Complaint</p>
                    <p className="text-sm text-secondary-900">{selectedAppointment.chiefComplaint}</p>
                  </div>
                )}
                {selectedAppointment.notes && (
                  <div className="mt-2">
                    <p className="text-xs text-primary-600">Notes</p>
                    <p className="text-sm text-secondary-900">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAcceptAppointment(selectedAppointment.id)}
                  disabled={actionLoading}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                  Accept
                </button>
                <button
                  onClick={handleRescheduleClick}
                  className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Reschedule
                </button>
                <button
                  onClick={handleRejectClick}
                  className="btn-outline text-red-600 border-red-300 hover:bg-red-50 inline-flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity backdrop-blur-sm"
              style={{ backgroundColor: 'var(--color-dialog-overlay)' }}
              onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
            />

            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform shadow-modal rounded-2xl animate-scale-in" style={{ backgroundColor: 'var(--color-dialog-bg)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">Reject Appointment</h3>
              </div>
              
              <p className="text-sm text-secondary-600 mb-4">
                Please provide a reason for rejecting the appointment with{' '}
                <span className="font-medium text-secondary-900">
                  {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                </span>.
              </p>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="input min-h-[100px] w-full"
                rows={3}
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectAppointment}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="btn-danger flex-1 inline-flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Spinner size="sm" /> : <X className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity backdrop-blur-sm"
              style={{ backgroundColor: 'var(--color-dialog-overlay)' }}
              onClick={() => { setShowRescheduleModal(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleReason(''); }}
            />

            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform shadow-modal rounded-2xl animate-scale-in" style={{ backgroundColor: 'var(--color-dialog-bg)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900">Reschedule Appointment</h3>
              </div>
              
              <p className="text-sm text-secondary-600 mb-4">
                Reschedule appointment with{' '}
                <span className="font-medium text-secondary-900">
                  {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                </span>.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="label">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Reason for Rescheduling (Optional)</label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="input min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowRescheduleModal(false); setRescheduleDate(''); setRescheduleTime(''); setRescheduleReason(''); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleAppointment}
                  disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Spinner size="sm" /> : <Calendar className="w-4 h-4" />}
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
