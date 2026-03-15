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
  ShoppingCart
} from 'lucide-react';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import { pharmacyAPI } from '../../lib/api';

interface DashboardStats {
  pendingPrescriptions: number;
  todaySales: number;
  lowStockItems: number;
  expiringItems: number;
  recentTransactions: Array<{
    id: string;
    patientName: string;
    amount: number;
    time: string;
  }>;
}

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end gap-2">
        <Link to="/pharmacy/inventory" className="btn-secondary inline-flex items-center gap-2">
          <Package className="w-4 h-4" />
          Manage Inventory
        </Link>
        <Link to="/pharmacy/prescriptions" className="btn-primary inline-flex items-center gap-2">
          <FileText className="w-4 h-4" />
          View Prescriptions
        </Link>
      </div>

      {/* Stats Cards - Small metric cards remain unchanged */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Pending</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.pendingPrescriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Today's Sales</p>
              <p className="text-xl font-bold text-secondary-900">₹{(stats?.todaySales || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Low Stock</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.lowStockItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Expiring Soon</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.expiringItems || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {(stats?.lowStockItems || 0) > 0 || (stats?.expiringItems || 0) > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Attention Required</h3>
              <div className="mt-2 text-sm text-red-700">
                {(stats?.lowStockItems || 0) > 0 && <p>• {stats?.lowStockItems} items are below reorder level</p>}
                {(stats?.expiringItems || 0) > 0 && <p>• {stats?.expiringItems} items are expiring within 30 days</p>}
              </div>
              <Link to="/pharmacy/inventory?filter=alerts" className="btn-secondary btn-sm mt-3 inline-flex items-center gap-2">
                View Alerts
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Transactions & Quick Actions - Collapsible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <CollapsibleCard
          title="Recent Transactions"
          subtitle="Latest pharmacy sales"
          icon={<IndianRupee className="w-5 h-5 text-green-600" />}
          iconBgColor="bg-green-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="space-y-2">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 2).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600">{tx.patientName}</span>
                    <span className="font-medium text-green-600">₹{tx.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary-500">No recent transactions</p>
              )}
            </div>
          }
        >
          <div className="space-y-3">
            {stats?.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">{tx.patientName}</p>
                  <p className="text-sm text-secondary-600">{tx.time}</p>
                </div>
                <span className="font-semibold text-green-600">₹{tx.amount.toLocaleString()}</span>
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <div className="text-center py-8 text-secondary-500">
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
          defaultCollapsed={true}
          collapsedContent={
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                to="/pharmacy/prescriptions"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700"
              >
                <FileText className="w-4 h-4" />
                Pending Prescriptions
              </Link>
              <Link
                to="/pharmacy/inventory"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
              >
                <Package className="w-4 h-4" />
                Inventory
              </Link>
              <Link
                to="/pharmacy/dispense"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
              >
                <ShoppingCart className="w-4 h-4" />
                Dispense Medicine
              </Link>
              <Link
                to="/pharmacy/reports"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700"
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </Link>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/pharmacy/prescriptions"
              className="flex flex-col items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <FileText className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-primary-700">Pending Prescriptions</span>
            </Link>

            <Link
              to="/pharmacy/inventory"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-700">Inventory</span>
            </Link>

            <Link
              to="/pharmacy/dispense"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-700">Dispense Medicine</span>
            </Link>

            <Link
              to="/pharmacy/reports"
              className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-700">Reports</span>
            </Link>
          </div>
        </CollapsibleCard>
      </div>
    </div>
  );
}
