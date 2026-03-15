import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  Activity,
  Search,
  Heart,
  ChevronRight,
  Phone,
  Zap,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import { nurseAPI } from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import { SkeletonDashboard } from '../../components/ui/Skeleton';

interface WaitingPatient {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  phone: string;
  appointmentTime: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
}

interface RecentVital {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  doctorName: string | null;
  recordedAt: string;
}

interface DashboardStats {
  totalPatients: number;
  vitalsCompleted: number;
  pendingVitals: number;
  recentVitals: RecentVital[];
  waitingForVitals: WaitingPatient[];
}

export default function NurseDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await nurseAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end gap-2">
        <Link to="/nurse/search" className="btn-secondary inline-flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>Search Patient</span>
        </Link>
        <Link to="/nurse/vitals" className="btn-primary inline-flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span>Record Vitals</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Patients Today"
          value={stats?.totalPatients || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          subtitle="Appointments scheduled"
        />
        <StatCard
          title="Vitals Completed"
          value={stats?.vitalsCompleted || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          subtitle="Records captured"
        />
        <StatCard
          title="Pending Vitals"
          value={stats?.pendingVitals || 0}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
          subtitle="Awaiting triage"
        />
      </div>

      {/* Main Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting for Vitals Card */}
        <CollapsibleCard
          title="Waiting for Vitals"
          subtitle={`${stats?.waitingForVitals?.length || 0} patients in next 2 hours`}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          iconBgColor="bg-yellow-100"
          defaultCollapsed={true}
          headerAction={
            <Link
              to="/nurse/vitals"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              Record Vitals
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
          collapsedContent={
            <div className="space-y-2">
              {stats?.waitingForVitals && stats.waitingForVitals.length > 0 ? (
                stats.waitingForVitals.slice(0, 3).map((patient) => (
                  <div key={patient.appointmentId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-secondary-700">{patient.patientName}</span>
                      <span className="text-secondary-400">•</span>
                      <span className="text-secondary-500">{patient.appointmentTime}</span>
                    </div>
                    <Link
                      to={`/nurse/vitals/${patient.patientId}?appointmentId=${patient.appointmentId}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Record
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No patients waiting</span>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {stats?.waitingForVitals && stats.waitingForVitals.length > 0 ? (
              stats.waitingForVitals.map((patient) => (
                <div
                  key={patient.appointmentId}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100 hover:border-yellow-200 hover:bg-yellow-100/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{patient.patientName}</p>
                      <div className="flex items-center gap-2 text-xs text-secondary-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {patient.appointmentTime}
                        </span>
                      </div>
                      <p className="text-xs text-primary-600 mt-0.5">
                        {patient.doctorName} • {patient.specialty}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/nurse/vitals/${patient.patientId}?appointmentId=${patient.appointmentId}`}
                    className="btn-primary btn-sm inline-flex items-center gap-1"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Record
                  </Link>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-secondary-700">All caught up!</p>
                <p className="text-xs text-secondary-500">No patients waiting for vitals in the next 2 hours</p>
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Recent Vitals Recorded Card */}
        <CollapsibleCard
          title="Recent Vitals Recorded"
          subtitle="Latest 3 patient vitals"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBgColor="bg-green-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="space-y-2">
              {stats?.recentVitals && stats.recentVitals.length > 0 ? (
                stats.recentVitals.map((vital) => (
                  <div key={vital.id} className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600">{vital.patientName}</span>
                    <span className="text-secondary-500">
                      {new Date(vital.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary-500">No vitals recorded yet</p>
              )}
            </div>
          }
        >
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {stats?.recentVitals && stats.recentVitals.length > 0 ? (
              stats.recentVitals.map((vital) => (
                <div
                  key={vital.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="font-medium text-secondary-900">{vital.patientName}</p>
                      <p className="text-xs text-secondary-500">ID: {vital.patientNumber}</p>
                      {vital.doctorName && (
                        <p className="text-xs text-primary-600 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3" />
                          {vital.doctorName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary-500">Recorded at</p>
                    <p className="text-sm font-medium text-secondary-700">
                      {new Date(vital.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-medium text-secondary-700">No vitals recorded</p>
                <p className="text-xs text-secondary-500">Start recording patient vitals</p>
              </div>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Quick Actions Card */}
      <CollapsibleCard
        title="Quick Actions"
        subtitle="Frequently used operations"
        icon={<Zap className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/nurse/search"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
            >
              <Search className="w-4 h-4" />
              Search Patient
            </Link>
            <Link
              to="/nurse/vitals"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-healthcare-50 text-healthcare-700"
            >
              <Heart className="w-4 h-4" />
              Record Vitals
            </Link>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <Link
            to="/nurse/search"
            className="group flex flex-col items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors duration-200">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-primary-700">Search Patient</span>
          </Link>

          <Link
            to="/nurse/vitals"
            className="group flex flex-col items-center p-4 bg-gradient-to-br from-healthcare-50 to-healthcare-100/50 rounded-xl border border-healthcare-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-healthcare-100 flex items-center justify-center mb-3 group-hover:bg-healthcare-200 transition-colors duration-200">
              <Heart className="w-6 h-6 text-healthcare-600" />
            </div>
            <span className="text-sm font-medium text-healthcare-700">Record Vitals</span>
          </Link>
        </div>
      </CollapsibleCard>
    </div>
  );
}
