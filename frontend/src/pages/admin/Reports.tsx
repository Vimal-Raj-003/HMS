import { useEffect, useState } from 'react';
import {
  Users,
  IndianRupee,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  BarChart3,
  Activity,
  FileText,
  Package,
  Stethoscope,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import api from '../../lib/api';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

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

const DEPT_COLORS = ['#2563EB', '#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

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

      setSummaryData(summaryRes.data?.data || summaryRes.data);
      setDailyStats(dailyRes.data?.data || dailyRes.data);
      setDepartmentStats(deptRes.data?.data || deptRes.data);
    } catch {
      // Fallback data when endpoints are not yet available
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
        { date: '2024-01-04', patients: 61, revenue: 41000, appointments: 55 },
        { date: '2024-01-05', patients: 48, revenue: 29000, appointments: 42 },
        { date: '2024-01-06', patients: 35, revenue: 21000, appointments: 28 },
        { date: '2024-01-07', patients: 55, revenue: 36000, appointments: 49 },
      ]);
      setDepartmentStats([
        { department: 'General Medicine', count: 120 },
        { department: 'Pediatrics', count: 85 },
        { department: 'Orthopedics', count: 65 },
        { department: 'Dermatology', count: 45 },
        { department: 'Cardiology', count: 38 },
        { department: 'Neurology', count: 28 },
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
    } catch {
      alert('Export functionality will be available soon');
    }
  };

  const getKpiIcon = (index: number) => {
    const icons = [Users, IndianRupee, Calendar, Clock];
    const Icon = icons[index] || Activity;
    return <Icon className="w-6 h-6" />;
  };

  const getKpiColor = (index: number) => {
    const configs = [
      { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
      { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20' },
      { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
    ];
    return configs[index] || configs[0];
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
      {/* Header Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-400" />
          <span className="text-sm text-secondary-600 dark:text-gray-400">
            {dateRange.startDate} — {dateRange.endDate}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport('patients')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Patients
          </button>
          <button
            onClick={() => exportReport('revenue')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Revenue
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-gray-700 shadow-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-secondary-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded-lg border-secondary-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm text-secondary-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded-lg border-secondary-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm text-secondary-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={fetchReportData}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item, index) => {
          const color = getKpiColor(index);
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-gray-700 shadow-card p-5 hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center ${color.text} ring-4 ${color.ring} group-hover:scale-110 transition-transform duration-200`}>
                  {getKpiIcon(index)}
                </div>
                {item.change !== undefined && (
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                      item.change >= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {item.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(item.change)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{item.value}</p>
              <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Flow Chart */}
        <CollapsibleCard
          title="Patient Flow"
          subtitle="Daily patient & appointment trends"
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-100"
          defaultCollapsed={false}
          collapsedContent={
            <span className="text-sm text-secondary-600">
              {dailyStats.length} days of data
            </span>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#patientGrad)"
                  name="Patients"
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  fill="url(#apptGrad)"
                  name="Appointments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs text-secondary-600 dark:text-gray-400">Patients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-xs text-secondary-600 dark:text-gray-400">Appointments</span>
            </div>
          </div>
        </CollapsibleCard>

        {/* Department Distribution */}
        <CollapsibleCard
          title="Department Distribution"
          subtitle="Patients by department"
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          iconBgColor="bg-purple-100"
          defaultCollapsed={false}
          collapsedContent={
            <span className="text-sm text-secondary-600">
              {departmentStats.length} departments
            </span>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  dataKey="department"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" name="Patients" radius={[0, 6, 6, 0]} barSize={20}>
                  {departmentStats.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleCard>
      </div>

      {/* Daily Statistics Table */}
      <CollapsibleCard
        title="Daily Statistics"
        subtitle="Detailed daily breakdown"
        icon={<FileText className="w-5 h-5 text-teal-600" />}
        iconBgColor="bg-teal-100"
        defaultCollapsed={true}
        collapsedContent={
          <span className="text-sm text-secondary-600">
            {dailyStats.length} days recorded
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-secondary-50/80 dark:bg-gray-800/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Appointments
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-gray-700">
              {dailyStats.map((day, index) => (
                <tr key={index} className="hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-secondary-900 dark:text-gray-100">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-secondary-700 dark:text-gray-300">{day.patients}</td>
                  <td className="px-5 py-3 text-sm text-right text-secondary-700 dark:text-gray-300">{day.appointments}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-secondary-900 dark:text-gray-100">
                    ₹{day.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>

      {/* Quick Reports */}
      <CollapsibleCard
        title="Quick Reports"
        subtitle="Generate and export specific reports"
        icon={<Download className="w-5 h-5 text-indigo-600" />}
        iconBgColor="bg-indigo-100"
        defaultCollapsed={true}
        collapsedContent={
          <span className="text-sm text-secondary-600">4 report types available</span>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
          {[
            { type: 'appointments', icon: Calendar, label: 'Appointment Report', desc: 'All appointments', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
            { type: 'billing', icon: IndianRupee, label: 'Billing Report', desc: 'Revenue & collections', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { type: 'inventory', icon: Package, label: 'Inventory Report', desc: 'Stock levels', bgColor: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
            { type: 'doctors', icon: Stethoscope, label: 'Doctor Performance', desc: 'Consultations & ratings', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
          ].map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.type}
                onClick={() => exportReport(report.type)}
                className="group p-4 rounded-xl border border-secondary-200 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left bg-white dark:bg-gray-800"
              >
                <div className={`w-10 h-10 rounded-lg ${report.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${report.iconColor}`} />
                </div>
                <div className="font-medium text-sm text-secondary-900 dark:text-gray-100">{report.label}</div>
                <div className="text-xs text-secondary-500 dark:text-gray-400 mt-0.5">{report.desc}</div>
              </button>
            );
          })}
        </div>
      </CollapsibleCard>
    </div>
  );
}
