import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Calendar,
  IndianRupee,
  FileText,
  Activity,
  AlertTriangle,
  Info,
  ClipboardList,
  BarChart3,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface DashboardStats {
  todayStats: {
    totalPatients: number;
    newRegistrations: number;
    appointments: number;
    revenue: number;
    pendingBills: number;
  };
  queueStatus: Array<{
    department: string;
    waiting: number;
    inProgress: number;
  }>;
  alerts: Array<{
    type: string;
    message: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
        <Link
          to="/admin/patient-registration"
          className="btn-primary inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Patient</span>
        </Link>
        <Link
          to="/admin/appointments"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments</span>
        </Link>
      </div>

      {/* Today's Stats - Small metric cards remain unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.todayStats.totalPatients || 0}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend={{ value: 12, isPositive: true, label: 'vs last week' }}
        />
        <StatCard
          title="New Registrations"
          value={stats?.todayStats.newRegistrations || 0}
          icon={<UserPlus className="w-6 h-6" />}
          color="green"
          trend={{ value: 8, isPositive: true, label: 'today' }}
        />
        <StatCard
          title="Appointments"
          value={stats?.todayStats.appointments || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="purple"
          subtitle="Scheduled today"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(stats?.todayStats.revenue || 0).toLocaleString()}`}
          icon={<IndianRupee className="w-6 h-6" />}
          color="yellow"
          trend={{ value: 15, isPositive: true, label: 'vs yesterday' }}
        />
        <StatCard
          title="Pending Bills"
          value={stats?.todayStats.pendingBills || 0}
          icon={<FileText className="w-6 h-6" />}
          color="red"
          subtitle="Requires attention"
        />
      </div>

      {/* Queue Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Status - Collapsible */}
        <div className="lg:col-span-2">
          <CollapsibleCard
            title="Queue Status"
            subtitle="By department"
            icon={<Activity className="w-5 h-5 text-purple-600" />}
            iconBgColor="bg-purple-100"
            defaultCollapsed={true}
            headerAction={
              <Link
                to="/admin/queue"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
            collapsedContent={
              <div className="flex items-center gap-4 text-sm text-secondary-600">
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  {stats?.queueStatus?.length || 0} departments active
                </span>
                {stats?.queueStatus && stats.queueStatus.length > 0 && (
                  <>
                    <span className="text-secondary-400">•</span>
                    <span>
                      Total waiting: {stats.queueStatus.reduce((acc, dept) => acc + dept.waiting, 0)} patients
                    </span>
                  </>
                )}
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Waiting
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      In Progress
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {stats?.queueStatus.map((dept, index) => (
                    <tr key={index} className="hover:bg-primary-50/50 transition-colors duration-150">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-secondary-600">
                              {dept.department.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-secondary-900">{dept.department}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {dept.waiting} waiting
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {dept.inProgress} active
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-secondary-900">
                          {dept.waiting + dept.inProgress}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/queue?dept=${dept.department}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View Queue
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.queueStatus || stats.queueStatus.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center mb-3">
                            <Activity className="w-6 h-6 text-secondary-400" />
                          </div>
                          <p className="text-sm text-secondary-500">No queue data available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleCard>
        </div>

        {/* Alerts - Collapsible */}
        <CollapsibleCard
          title="Alerts"
          subtitle={`${stats?.alerts?.length || 0} active alerts`}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          iconBgColor="bg-red-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="flex items-center gap-4 text-sm text-secondary-600">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {stats?.alerts?.length || 0} alert{((stats?.alerts?.length || 0) !== 1) ? 's' : ''}
              </span>
              {stats?.alerts && stats.alerts.length > 0 && (
                <>
                  <span className="text-secondary-400">•</span>
                  <span>
                    {stats.alerts.filter(a => a.type === 'billing').length} billing, {' '}
                    {stats.alerts.filter(a => a.type === 'inventory').length} inventory
                  </span>
                </>
              )}
            </div>
          }
        >
          <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
            {stats?.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                  alert.type === 'inventory'
                    ? 'bg-orange-50 border-orange-200'
                    : alert.type === 'billing'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      alert.type === 'inventory'
                        ? 'bg-orange-100 text-orange-600'
                        : alert.type === 'billing'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {alert.type === 'inventory' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : alert.type === 'billing' ? (
                      <IndianRupee className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium ${
                        alert.type === 'inventory'
                          ? 'text-orange-800'
                          : alert.type === 'billing'
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </p>
                    <p className="text-sm text-secondary-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.alerts || stats.alerts.length === 0) && (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-secondary-700">All clear!</p>
                <p className="text-xs text-secondary-500">No active alerts</p>
              </div>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Quick Actions - Collapsible */}
      <CollapsibleCard
        title="Quick Actions"
        subtitle="Frequently used operations"
        icon={<Activity className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/admin/patient-registration"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              New Patient
            </Link>
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </Link>
            <Link
              to="/admin/queue"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Queue
            </Link>
            <Link
              to="/admin/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <IndianRupee className="w-4 h-4" />
              Billing
            </Link>
            <Link
              to="/admin/staff"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              Staff
            </Link>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </Link>
          </div>
        }
      >
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <Link
              to="/admin/patient-registration"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors duration-200">
                <UserPlus className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-primary-700">New Patient</span>
            </Link>

            <Link
              to="/admin/appointments"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors duration-200">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">Appointments</span>
            </Link>

            <Link
              to="/admin/queue"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors duration-200">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-700">Queue</span>
            </Link>

            <Link
              to="/admin/billing"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors duration-200">
                <IndianRupee className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-yellow-700">Billing</span>
            </Link>

            <Link
              to="/admin/staff"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors duration-200">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">Staff</span>
            </Link>

            <Link
              to="/admin/reports"
              className="group flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors duration-200">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-indigo-700">Reports</span>
            </Link>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
