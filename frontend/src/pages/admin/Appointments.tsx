import { useEffect, useState } from 'react';
import { Calendar, Filter, Table } from 'lucide-react';
import api from '../../lib/api';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: string;
  type: string;
  notes: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, [filter, dateFilter]);

  const mapAppointment = (raw: any): Appointment => ({
    id: raw.id,
    patientName: raw.patient
      ? `${raw.patient.firstName} ${raw.patient.lastName}`
      : raw.patientName || 'Unknown',
    patientPhone: raw.patient?.phone || raw.patientPhone || '',
    doctorName: raw.doctor
      ? `Dr. ${raw.doctor.firstName} ${raw.doctor.lastName}`
      : raw.doctorName || '',
    doctorSpecialization: raw.doctor?.specialty || raw.doctorSpecialization || '',
    date: raw.appointmentDate || raw.date || '',
    time: raw.startTime || raw.time || '',
    status: raw.status || 'SCHEDULED',
    type: raw.type || 'CONSULTATION',
    notes: raw.chiefComplaint || raw.notes || '',
  });

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (filter !== 'all') params.append('status', filter);

      const response = await api.get(`/admin/appointments?${params.toString()}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setAppointments(data.map(mapAppointment));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (status === 'CANCELLED') {
        await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by admin' });
      } else if (status === 'CONFIRMED') {
        await api.put(`/doctors/appointments/${id}/accept`);
      } else if (status === 'REJECTED') {
        await api.put(`/doctors/appointments/${id}/reject`, { reason: 'Rejected by admin' });
      }
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Collapsible */}
      <CollapsibleCard
        title="Filters"
        subtitle="Filter appointments by date and status"
        icon={<Filter className="w-5 h-5 text-primary-600" />}
        iconBgColor="bg-primary-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary-500" />
              <span className="text-secondary-600">{dateFilter ? new Date(dateFilter).toLocaleDateString() : 'All dates'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${filter === 'all' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                {filter === 'all' ? 'All Status' : filter}
              </span>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </CollapsibleCard>

      {/* Appointments List - Collapsible */}
      <CollapsibleCard
        title="Appointments List"
        subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} found`}
        icon={<Table className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={true}
        collapsedContent={
          <div className="space-y-2">
            {appointments.length > 0 ? (
              appointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-secondary-900">{apt.patientName}</span>
                    <span className="text-secondary-400">•</span>
                    <span className="text-secondary-600">{apt.doctorName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500">No appointments found</p>
            )}
            {appointments.length > 3 && (
              <p className="text-xs text-secondary-400">+{appointments.length - 3} more appointments</p>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Type
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
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{appointment.patientName}</div>
                      <div className="text-sm text-secondary-500">{appointment.patientPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{appointment.doctorName}</div>
                      <div className="text-sm text-secondary-500">{appointment.doctorSpecialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{appointment.date}</div>
                      <div className="text-sm text-secondary-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {appointment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className="text-sm border rounded-lg px-2 py-1 focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="NO_SHOW">No Show</option>
                      </select>
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
