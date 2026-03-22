import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  TestTube,
  FileText,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  ChevronRight,
  Activity,
  Zap
} from 'lucide-react';
import CollapsibleCard from '../../components/ui/CollapsibleCard';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import { labAPI } from '../../lib/api';

interface DashboardStats {
    pendingOrders: number;
    samplesCollected: number;
    resultsPending: number;
    completedToday: number;
    criticalAlerts: number;
    todayRevenue: number;
}

export default function LabDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await labAPI.getDashboardStats();
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
        <div className="space-y-4 sm:space-y-5">
            {/* Quick Actions */}
            <div className="flex justify-end gap-2">
                <Link to="/lab/orders" className="btn-secondary inline-flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    View Orders
                </Link>
                <Link to="/lab/catalog" className="btn-primary inline-flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Test Catalog
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="hms-stats-grid">
                <StatCard
                    title="Pending"
                    value={stats?.pendingOrders || 0}
                    icon={<ClipboardList className="w-6 h-6" />}
                    color="yellow"
                    subtitle="Orders waiting"
                />
                <StatCard
                    title="Collected"
                    value={stats?.samplesCollected || 0}
                    icon={<TestTube className="w-6 h-6" />}
                    color="blue"
                    subtitle="Samples taken"
                />
                <StatCard
                    title="Results Pending"
                    value={stats?.resultsPending || 0}
                    icon={<FileText className="w-6 h-6" />}
                    color="purple"
                    subtitle="Awaiting entry"
                />
                <StatCard
                    title="Completed"
                    value={stats?.completedToday || 0}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="green"
                    subtitle="Done today"
                />
                <StatCard
                    title="Critical"
                    value={stats?.criticalAlerts || 0}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    color="red"
                    subtitle="Urgent alerts"
                />
            </div>

            {/* Critical Alerts Banner */}
            {(stats?.criticalAlerts || 0) > 0 && (
                <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Values Detected</h3>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                {stats?.criticalAlerts} test(s) have critical values that require immediate attention.
                            </p>
                            <Link 
                                to="/lab/orders?filter=critical" 
                                className="btn-secondary btn-sm mt-3 inline-flex items-center gap-2"
                            >
                                View Critical Results
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions - Collapsible */}
            <CollapsibleCard
                title="Quick Actions"
                subtitle="Frequently used operations"
                icon={<Zap className="w-5 h-5 text-primary-600" />}
                iconBgColor="bg-primary-100"
                defaultCollapsed={true}
                collapsedContent={
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Link
                            to="/lab/orders?status=pending"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700"
                        >
                            <ClipboardList className="w-4 h-4" />
                            Pending Orders
                        </Link>
                        <Link
                            to="/lab/sample-collection"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                            <TestTube className="w-4 h-4" />
                            Sample Collection
                        </Link>
                        <Link
                            to="/lab/enter-results"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                        >
                            <FileText className="w-4 h-4" />
                            Enter Results
                        </Link>
                        <Link
                            to="/lab/test-catalog"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                        >
                            <FlaskConical className="w-4 h-4" />
                            Test Catalog
                        </Link>
                        <Link
                            to="/lab/reports"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Reports
                        </Link>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link
                        to="/lab/orders?status=pending"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700"
                    >
                        <ClipboardList className="w-4 h-4" />
                        Pending Orders
                    </Link>
                    <Link
                        to="/lab/sample-collection"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                        <TestTube className="w-4 h-4" />
                        Sample Collection
                    </Link>
                    <Link
                        to="/lab/enter-results"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                    >
                        <FileText className="w-4 h-4" />
                        Enter Results
                    </Link>
                    <Link
                        to="/lab/test-catalog"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
                    >
                        <FlaskConical className="w-4 h-4" />
                        Test Catalog
                    </Link>
                    <Link
                        to="/lab/reports"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Reports
                    </Link>
                </div>
            </CollapsibleCard>

            {/* Order Status Overview & Priority Actions - Collapsible */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Overview */}
                <CollapsibleCard
                    title="Order Status Overview"
                    subtitle="Current lab order status"
                    icon={<Activity className="w-5 h-5 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                    defaultCollapsed={true}
                    collapsedContent={
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pending Orders</span>
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.pendingOrders || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Samples Collected</span>
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.samplesCollected || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Results Pending</span>
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.resultsPending || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completed Today</span>
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.completedToday || 0}</span>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pending Orders</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.pendingOrders || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Samples Collected</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.samplesCollected || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Results Pending</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.resultsPending || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completed Today</span>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats?.completedToday || 0}</span>
                        </div>
                    </div>
                </CollapsibleCard>

                {/* Priority Actions */}
                <CollapsibleCard
                    title="Priority Actions"
                    subtitle="Urgent items requiring attention"
                    icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                    iconBgColor="bg-red-100"
                    defaultCollapsed={true}
                    collapsedContent={
                        <div className="space-y-3">
                            {(stats?.criticalAlerts || 0) > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {stats?.criticalAlerts} critical alert{((stats?.criticalAlerts || 0) !== 1) ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            {(stats?.pendingOrders || 0) > 0 && (
                                <div className="flex items-center gap-2 text-orange-600">
                                    <ClipboardList className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {stats?.pendingOrders} pending order{((stats?.pendingOrders || 0) !== 1) ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            {(stats?.resultsPending || 0) > 0 && (
                                <div className="flex items-center gap-2 text-purple-600">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {stats?.resultsPending} result{((stats?.resultsPending || 0) !== 1) ? 's' : ''} pending
                                    </span>
                                </div>
                            )}
                            {(!stats?.criticalAlerts && !stats?.pendingOrders && !stats?.resultsPending) && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">All caught up!</span>
                                </div>
                            )}
                        </div>
                    }
                >
                    <div className="space-y-3">
                        {(stats?.criticalAlerts || 0) > 0 && (
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {stats?.criticalAlerts} critical alert{((stats?.criticalAlerts || 0) !== 1) ? 's' : ''}
                                </span>
                            </div>
                        )}
                        {(stats?.pendingOrders || 0) > 0 && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <ClipboardList className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {stats?.pendingOrders} pending order{((stats?.pendingOrders || 0) !== 1) ? 's' : ''}
                                </span>
                            </div>
                        )}
                        {(stats?.resultsPending || 0) > 0 && (
                            <div className="flex items-center gap-2 text-purple-600">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {stats?.resultsPending} result{((stats?.resultsPending || 0) !== 1) ? 's' : ''} pending
                                </span>
                            </div>
                        )}
                        {(!stats?.criticalAlerts && !stats?.pendingOrders && !stats?.resultsPending) && (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">All caught up!</span>
                            </div>
                        )}
                    </div>
                </CollapsibleCard>
            </div>

            {/* Additional Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sample Collection */}
                <CollapsibleCard
                    title="Sample Collection"
                    subtitle="Collect patient samples"
                    icon={<TestTube className="w-5 h-5 text-blue-600" />}
                    iconBgColor="bg-blue-100"
                    defaultCollapsed={true}
                    collapsedContent={
                        <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ready for collection</span>
                            <Link 
                                to="/lab/sample-collection"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                            >
                                Go <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    }
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ready for collection</span>
                        <Link 
                            to="/lab/sample-collection"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                            Go <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </CollapsibleCard>

                {/* Enter Results */}
                <CollapsibleCard
                    title="Enter Results"
                    subtitle="Record test results"
                    icon={<FileText className="w-5 h-5 text-purple-600" />}
                    iconBgColor="bg-purple-100"
                    defaultCollapsed={true}
                    collapsedContent={
                        <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Results awaiting entry</span>
                            <Link 
                                to="/lab/enter-results"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                            >
                                Go <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    }
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Results awaiting entry</span>
                        <Link 
                            to="/lab/enter-results"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                        >
                            Go <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </CollapsibleCard>

                {/* Test Catalog */}
                <CollapsibleCard
                    title="Test Catalog"
                    subtitle="Manage test catalog"
                    icon={<FlaskConical className="w-5 h-5 text-green-600" />}
                    iconBgColor="bg-green-100"
                    defaultCollapsed={true}
                    collapsedContent={
                        <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage tests</span>
                            <Link 
                                to="/lab/test-catalog"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
                            >
                                Go <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    }
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage tests</span>
                        <Link 
                            to="/lab/test-catalog"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
                        >
                            Go <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </CollapsibleCard>
            </div>
        </div>
    );
}
