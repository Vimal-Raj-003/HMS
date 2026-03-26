import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  IndianRupee,
  AlertTriangle,
  Clock,
  Package,
  Pill,
  BarChart3,
  Plus,
  Receipt,
  TrendingUp,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import { pharmacyAPI } from '../../lib/api';

interface DashboardStats {
  pendingPrescriptions: number;
  todaySales: number;
  lowStockItems: number;
  expiringItems: number;
  monthlySales: number;
  recentTransactions: Array<{
    id: string;
    dispenseNumber: string;
    patientName: string;
    patientNumber: string;
    amount: number;
    time: string;
  }>;
  topSellingMedicines: Array<{
    medicineId: string;
    medicineName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await pharmacyAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-3">
      {/* Header with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pharmacy Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/pharmacy/inventory" className="btn-secondary inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            Manage Inventory
          </Link>
          <Link to="/pharmacy/prescriptions" className="btn-primary inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View Prescriptions
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="hms-stats-grid">
        <StatCard
          title="Pending"
          value={stats?.pendingPrescriptions || 0}
          icon={<FileText className="w-6 h-6" />}
          color="yellow"
          subtitle="Prescriptions waiting"
          onClick={() => window.location.href = '/pharmacy/prescriptions'}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales || 0)}
          icon={<IndianRupee className="w-6 h-6" />}
          color="green"
          subtitle="Revenue today"
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockItems || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
          subtitle="Below reorder level"
          onClick={() => window.location.href = '/pharmacy/inventory?filter=lowStock'}
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiringItems || 0}
          icon={<Clock className="w-6 h-6" />}
          color="purple"
          subtitle="Within 60 days"
          onClick={() => window.location.href = '/pharmacy/inventory?filter=expiring'}
        />
      </div>

      {/* Alerts Banner with Action Buttons */}
      {(stats?.lowStockItems || 0) > 0 || (stats?.expiringItems || 0) > 0 ? (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-300">Attention Required</h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-400 space-y-0.5">
                {(stats?.lowStockItems || 0) > 0 && (
                  <p>• {stats?.lowStockItems} items are below reorder level</p>
                )}
                {(stats?.expiringItems || 0) > 0 && (
                  <p>• {stats?.expiringItems} items are expiring within 60 days</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  to="/pharmacy/inventory?filter=alerts"
                  className="btn-secondary btn-sm inline-flex items-center gap-1.5"
                >
                  View All Alerts
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/pharmacy/inventory" className="btn-secondary btn-sm inline-flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Manage Inventory
                </Link>
                <Link to="/pharmacy/prescriptions" className="btn-secondary btn-sm inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  View Prescriptions
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Monthly Summary */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">Monthly Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(stats?.monthlySales || 0)}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="hms-two-col">
        {/* Recent Transactions */}
        <CollapsibleCard
          title="Recent Transactions"
          subtitle="Latest pharmacy sales"
          icon={<IndianRupee className="w-5 h-5 text-green-600" />}
          iconBgColor="bg-green-100"
          defaultCollapsed={false}
          collapsedContent={
            <div className="space-y-2">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-secondary-700">{tx.patientName}</span>
                      <span className="text-secondary-400 ml-2">({tx.patientNumber})</span>
                    </div>
                    <span className="font-medium text-green-600">{formatCurrency(tx.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary-500">No recent transactions</p>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-gray-800 rounded-lg hover:bg-secondary-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Receipt className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{tx.patientName}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{tx.dispenseNumber} • {formatTime(tx.time)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">{formatCurrency(tx.amount)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Quick Actions */}
        <CollapsibleCard
          title="Quick Actions"
          subtitle="Frequently used operations"
          icon={<Pill className="w-5 h-5 text-primary-600" />}
          iconBgColor="bg-primary-100"
          defaultCollapsed={false}
          collapsedContent={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/pharmacy/prescriptions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100"
              >
                <FileText className="w-3.5 h-3.5" />
                Pending ({stats?.pendingPrescriptions || 0})
              </Link>
              <Link
                to="/pharmacy/inventory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
              >
                <Package className="w-3.5 h-3.5" />
                Inventory
              </Link>
              <Link
                to="/pharmacy/bills"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
              >
                <Receipt className="w-3.5 h-3.5" />
                Bills
              </Link>
              <Link
                to="/pharmacy/expenses"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                Expenses
              </Link>
              <Link
                to="/pharmacy/reports"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Reports
              </Link>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/pharmacy/prescriptions"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors group"
            >
              <div className="p-3 bg-orange-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-orange-700">Pending Prescriptions</span>
              <span className="text-xs text-orange-500 mt-1">{stats?.pendingPrescriptions || 0} waiting</span>
            </Link>

            <Link
              to="/pharmacy/inventory"
              className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
            >
              <div className="p-3 bg-green-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">Manage Inventory</span>
              <span className="text-xs text-green-500 mt-1">Stock & batches</span>
            </Link>

            <Link
              to="/pharmacy/manual-billing"
              className="flex flex-col items-center p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors group"
            >
              <div className="p-3 bg-teal-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-teal-700">Manual Billing</span>
              <span className="text-xs text-teal-500 mt-1">Over the counter</span>
            </Link>

            <Link
              to="/pharmacy/inventory?action=add"
              className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group"
            >
              <div className="p-3 bg-emerald-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-700">Add Stock</span>
              <span className="text-xs text-emerald-500 mt-1">Stock in</span>
            </Link>

            <Link
              to="/pharmacy/bills"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
            >
              <div className="p-3 bg-purple-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-700">View Bills</span>
              <span className="text-xs text-purple-500 mt-1">Sales history</span>
            </Link>

            <Link
              to="/pharmacy/expenses"
              className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors group"
            >
              <div className="p-3 bg-red-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <IndianRupee className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-700">Expenses</span>
              <span className="text-xs text-red-500 mt-1">Track spending</span>
            </Link>

            <Link
              to="/pharmacy/reports"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
            >
              <div className="p-3 bg-blue-100 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">Reports</span>
              <span className="text-xs text-blue-500 mt-1">Analytics</span>
            </Link>
          </div>
        </CollapsibleCard>
      </div>

      {/* Top Selling Medicines */}
      <CollapsibleCard
        title="Top Selling Medicines"
        subtitle="Last 30 days performance"
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-100"
        defaultCollapsed={false}
        collapsedContent={
          <div className="space-y-2">
            {stats?.topSellingMedicines && stats.topSellingMedicines.length > 0 ? (
              stats.topSellingMedicines.slice(0, 3).map((med, index) => (
                <div key={med.medicineId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-secondary-700">{med.medicineName}</span>
                  </div>
                  <span className="text-secondary-500">{med.totalQuantity} units</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-500">No data available</p>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          {stats?.topSellingMedicines && stats.topSellingMedicines.length > 0 ? (
            stats.topSellingMedicines.map((med, index) => (
              <div key={med.medicineId} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-gray-800 rounded-lg hover:bg-secondary-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{med.medicineName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{med.totalQuantity} units sold</p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">{formatCurrency(med.totalRevenue)}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No sales data available</p>
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
