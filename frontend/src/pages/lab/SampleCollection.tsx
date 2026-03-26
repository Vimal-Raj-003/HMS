import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labAPI } from '../../lib/api';

interface Test {
  id: string;
  testId: string;
  name: string;
  code: string;
  category: string;
  sampleType: string;
  status: string;
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
  };
  doctorName: string;
  priority: string;
  tests: Test[];
}

export default function SampleCollection() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState({
    sampleType: 'Blood',
    collectionNotes: '',
  });

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [orderId, orders]);

  const fetchPendingOrders = async () => {
    try {
      const response = await labAPI.getOrders({ status: 'ordered,recommended' });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    // Update URL with orderId
    navigate(`/lab/sample/${order.id}`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await labAPI.collectSample(selectedOrder.id, {
        sampleType: sampleData.sampleType,
        collectionNotes: sampleData.collectionNotes,
      });
      
      // Refresh the list
      await fetchPendingOrders();
      
      // Clear selection and navigate back to list
      setSelectedOrder(null);
      navigate('/lab/sample', { replace: true });
      
      alert('Sample collected successfully!');
    } catch (error) {
      console.error('Error collecting sample:', error);
      alert('Failed to collect sample. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-orange-100 border-orange-500';
      case 'critical':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-white border-secondary-200';
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
      <h1 className="text-2xl font-bold text-secondary-900">Sample Collection</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-secondary-700">Pending Orders ({orders.length})</h2>
          
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-8 text-center text-secondary-500">
              No pending orders for sample collection
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className={`bg-white rounded-xl border-2 shadow-card p-4 cursor-pointer transition-all hover:shadow-card-hover ${
                  selectedOrder?.id === order.id ? 'border-primary-500' : 'border-transparent'
                } ${getPriorityColor(order.priority)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-secondary-900">{order.patientName}</h3>
                    <p className="text-sm text-secondary-500">{order.patientNumber}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.priority.toLowerCase() === 'critical' ? 'bg-red-500 text-white' :
                    order.priority.toLowerCase() === 'urgent' ? 'bg-orange-500 text-white' :
                    'bg-secondary-100 text-secondary-600'
                  }`}>
                    {order.priority}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-secondary-600">Order: {order.orderNumber}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {order.tests.slice(0, 3).map((test) => (
                      <span key={test.id} className="px-2 py-0.5 text-xs bg-secondary-100 text-secondary-600 rounded">
                        {test.name}
                      </span>
                    ))}
                    {order.tests.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-secondary-100 text-secondary-600 rounded">
                        +{order.tests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Collection Form */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6">
          <h2 className="text-lg font-semibold text-secondary-700 mb-4">Collect Sample</h2>
          
          {!selectedOrder ? (
            <div className="text-center py-8 text-secondary-500">
              Select an order from the list to collect sample
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient Info */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-secondary-900">{selectedOrder.patientName}</h3>
                <p className="text-sm text-secondary-500">
                  Patient ID: {selectedOrder.patientNumber} • {selectedOrder.doctorName}
                </p>
              </div>

              {/* Tests to Collect */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Tests</label>
                <div className="space-y-2">
                  {selectedOrder.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">{test.name}</p>
                        <p className="text-xs text-secondary-500">{test.code} • {test.category}</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700">Sample Type</label>
                <select
                  value={sampleData.sampleType}
                  onChange={(e) => setSampleData({ ...sampleData, sampleType: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                >
                  <option value="Blood">Blood</option>
                  <option value="Urine">Urine</option>
                  <option value="Saliva">Saliva</option>
                  <option value="Swab">Swab</option>
                  <option value="Sputum">Sputum</option>
                  <option value="Tissue">Tissue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Collection Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700">Collection Notes</label>
                <textarea
                  value={sampleData.collectionNotes}
                  onChange={(e) => setSampleData({ ...sampleData, collectionNotes: e.target.value })}
                  rows={3}
                  placeholder="Any observations about the sample..."
                  className="mt-1 block w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
                />
              </div>

              {/* Barcode Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">📋</div>
                  <div>
                    <h3 className="font-medium text-blue-900">Sample Barcode</h3>
                    <p className="text-sm text-blue-700">
                      A unique barcode will be generated automatically upon submission.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    navigate('/lab/sample', { replace: true });
                  }}
                  className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 py-2 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Sample Collection'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
