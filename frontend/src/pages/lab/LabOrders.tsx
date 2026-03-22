import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { labAPI } from '../../lib/api';

interface Test {
  id: string;
  testId: string;
  name: string;
  code: string;
  category: string;
  status: string;
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
  isCritical?: boolean;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    patientNumber: string;
    dateOfBirth: string;
    gender: string;
  };
  doctorName: string;
  orderedAt: string;
  priority: string;
  status: string;
  tests: Test[];
  notes?: string;
}

export default function LabOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const response = await labAPI.getOrders(filter !== 'all' ? { status: filter } : undefined);
      // API interceptor unwraps the data, so response.data is already the orders array
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newFilter);
    }
    setSearchParams(searchParams);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.patientNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ordered':
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'sample_collected':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'critical':
      case 'stat':
        return 'bg-red-700 text-white animate-pulse';
      case 'normal':
      case 'routine':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyStyle = (order: LabOrder) => {
    if (order.priority.toLowerCase() === 'critical' || order.priority.toLowerCase() === 'stat') {
      return 'border-l-4 border-red-500';
    }
    if (order.priority.toLowerCase() === 'urgent') {
      return 'border-l-4 border-orange-500';
    }
    return '';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate stats - include both 'ordered' and 'recommended' as pending
  const stats = {
    pending: orders.filter(o => ['ordered', 'recommended', 'pending'].includes(o.status.toLowerCase())).length,
    collected: orders.filter(o => o.status.toLowerCase() === 'sample_collected').length,
    processing: orders.filter(o => ['processing', 'in_progress'].includes(o.status.toLowerCase())).length,
    completed: orders.filter(o => o.status.toLowerCase() === 'completed').length,
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
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Lab Orders</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-secondary-500">Pending</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-secondary-500">Collected</div>
              <div className="text-2xl font-bold text-blue-600">{stats.collected}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-secondary-500">Processing</div>
              <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-secondary-500">Completed</div>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by patient name, ID, or order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
          />
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
          >
            <option value="all">All Orders</option>
            <option value="recommended">Recommended</option>
            <option value="ordered">Ordered</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-8 text-center text-secondary-500">
            No lab orders found
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow ${getUrgencyStyle(order)}`}
            >
              <div className="p-4 border-b border-secondary-200">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-secondary-900">{order.patientName}</h3>
                      <span className="text-sm text-secondary-500">({order.patientNumber})</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-500 mt-1">
                      Order: {order.orderNumber} • {order.doctorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                    <p className="text-xs text-secondary-400 mt-1">
                      {new Date(order.orderedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {order.tests.map((test) => (
                    <span
                      key={test.id}
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        test.status.toLowerCase() === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : test.isCritical
                          ? 'bg-red-100 text-red-800'
                          : 'bg-secondary-100 text-secondary-600'
                      }`}
                    >
                      {test.name}
                      {test.isCritical && ' ⚠️'}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  {(order.status.toLowerCase() === 'ordered' || order.status.toLowerCase() === 'recommended') && (
                    <button
                      onClick={() => navigate(`/lab/sample-collection?orderId=${order.id}`)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Collect Sample
                    </button>
                  )}
                  {(order.status.toLowerCase() === 'sample_collected' || order.status.toLowerCase() === 'processing') && (
                    <button
                      onClick={() => navigate(`/lab/enter-results?orderId=${order.id}`)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Enter Results
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/lab/orders/${order.id}`)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
