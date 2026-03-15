import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle, Timer, Table } from 'lucide-react';
import api from '../../lib/api';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  department: string;
  doctorName: string;
  status: string;
  priority: string;
  checkInTime: string;
  waitingTime: string;
}

export default function QueueManagement() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [departmentFilter]);

  const fetchQueue = async () => {
    try {
      const params = departmentFilter !== 'all' ? `?department=${departmentFilter}` : '';
      const response = await api.get(`/queue${params}`);
      setQueue(response.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/queue/${id}/status`, { status });
      fetchQueue();
    } catch (error) {
      console.error('Error updating queue status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const departments = [...new Set(queue.map(q => q.department))];
  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const inProgressCount = queue.filter(q => q.status === 'IN_PROGRESS').length;
  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;
  const avgWaitTime = waitingCount > 0 
    ? queue.filter(q => q.status === 'WAITING').reduce((acc, q) => {
        const wait = parseInt(q.waitingTime) || 0;
        return acc + wait;
      }, 0) / waitingCount 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards - Small metric cards remain unchanged */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Waiting</p>
              <p className="text-xl font-bold text-secondary-900">{waitingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">In Progress</p>
              <p className="text-xl font-bold text-secondary-900">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Completed</p>
              <p className="text-xl font-bold text-secondary-900">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Timer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Avg Wait</p>
              <p className="text-xl font-bold text-secondary-900">{Math.round(avgWaitTime)} min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List - Collapsible */}
      <CollapsibleCard
        title="Patient Queue"
        subtitle={`${queue.length} patient${queue.length !== 1 ? 's' : ''} in queue`}
        icon={<Table className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="space-y-2">
            {queue.length > 0 ? (
              queue.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary-600">#{entry.tokenNumber}</span>
                    <span className="text-secondary-900">{entry.patientName}</span>
                    <span className="text-secondary-400">•</span>
                    <span className="text-secondary-600">{entry.department}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500">No patients in queue</p>
            )}
            {queue.length > 3 && (
              <p className="text-xs text-secondary-400">+{queue.length - 3} more patients</p>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Token #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Department / Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-secondary-500">
                    No patients in queue
                  </td>
                </tr>
              ) : (
                queue.map((entry) => (
                  <tr key={entry.id} className={`${entry.priority === 'EMERGENCY' ? 'bg-red-50' : ''} hover:bg-secondary-50 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl font-bold text-primary-600">#{entry.tokenNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{entry.patientName}</div>
                      <div className="text-sm text-secondary-500">{entry.patientPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{entry.department}</div>
                      <div className="text-sm text-secondary-500">{entry.doctorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(entry.priority)}`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {entry.waitingTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {entry.status === 'WAITING' && (
                        <button
                          onClick={() => handleStatusChange(entry.id, 'IN_PROGRESS')}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Call
                        </button>
                      )}
                      {entry.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(entry.id, 'COMPLETED')}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Complete
                        </button>
                      )}
                      {entry.status !== 'COMPLETED' && entry.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleStatusChange(entry.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
    </div>
  );
}
