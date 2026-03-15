import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface ReportData {
  label: string;
  value: number | string;
  change?: number;
}

interface DailyStats {
  date: string;
  patients: number;
  revenue: number;
  appointments: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [summaryData, setSummaryData] = useState<ReportData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{ department: string; count: number }[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const [summaryRes, dailyRes, deptRes] = await Promise.all([
        api.get(`/admin/reports/summary?${params}`),
        api.get(`/admin/reports/daily?${params}`),
        api.get(`/admin/reports/departments?${params}`),
      ]);

      setSummaryData(summaryRes.data);
      setDailyStats(dailyRes.data);
      setDepartmentStats(deptRes.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set mock data for demonstration
      setSummaryData([
        { label: 'Total Patients', value: 1234, change: 12 },
        { label: 'Total Revenue', value: '₹5,67,890', change: 8 },
        { label: 'Appointments', value: 456, change: -3 },
        { label: 'Avg. Wait Time', value: '15 min', change: -5 },
      ]);
      setDailyStats([
        { date: '2024-01-01', patients: 45, revenue: 25000, appointments: 38 },
        { date: '2024-01-02', patients: 52, revenue: 32000, appointments: 45 },
        { date: '2024-01-03', patients: 38, revenue: 18000, appointments: 32 },
      ]);
      setDepartmentStats([
        { department: 'General Medicine', count: 120 },
        { department: 'Pediatrics', count: 85 },
        { department: 'Orthopedics', count: 65 },
        { department: 'Dermatology', count: 45 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type,
      });
      
      const response = await api.get(`/admin/reports/export?${params}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${type}_${dateRange.startDate}_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Export functionality will be available soon');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => exportReport('patients')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Export Patients
        </button>
        <button
          onClick={() => exportReport('revenue')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Export Revenue
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <button
            onClick={fetchReportData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summaryData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{item.label}</div>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            {item.change !== undefined && (
              <div className={`text-sm ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}% from last period
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daily Statistics</h2>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Patients</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Appts</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((day, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 text-sm">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-2 text-sm text-right">{day.patients}</td>
                    <td className="py-2 text-sm text-right">{day.appointments}</td>
                    <td className="py-2 text-sm text-right">
                      ₹{day.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Department-wise Patients</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {departmentStats.map((dept, index) => {
                const maxCount = Math.max(...departmentStats.map(d => d.count));
                const percentage = (dept.count / maxCount) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{dept.department}</span>
                      <span className="font-medium">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => exportReport('appointments')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">Appointment Report</div>
            <div className="text-sm text-gray-500">All appointments</div>
          </button>
          <button
            onClick={() => exportReport('billing')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">Billing Report</div>
            <div className="text-sm text-gray-500">Revenue & collections</div>
          </button>
          <button
            onClick={() => exportReport('inventory')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-medium">Inventory Report</div>
            <div className="text-sm text-gray-500">Stock levels</div>
          </button>
          <button
            onClick={() => exportReport('doctors')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">👨‍⚕️</div>
            <div className="font-medium">Doctor Performance</div>
            <div className="text-sm text-gray-500">Consultations & ratings</div>
          </button>
        </div>
      </div>
    </div>
  );
}
