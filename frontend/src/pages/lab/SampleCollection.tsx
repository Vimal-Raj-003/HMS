import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Test {
  id: string;
  name: string;
  sampleType: string;
  status: string;
}

interface LabOrder {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  tests: Test[];
}

export default function SampleCollection() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState({
    collectedBy: '',
    collectionTime: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/lab/orders/${orderId}`);
      setOrder(response.data);
      // Pre-select all pending tests
      setSelectedTests(
        response.data.tests
          .filter((t: Test) => t.status === 'PENDING')
          .map((t: Test) => t.id)
      );
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (testId: string) => {
    if (selectedTests.includes(testId)) {
      setSelectedTests(selectedTests.filter((id) => id !== testId));
    } else {
      setSelectedTests([...selectedTests, testId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || selectedTests.length === 0) return;

    setSubmitting(true);
    try {
      await api.post(`/lab/orders/${orderId}/collect-sample`, {
        testIds: selectedTests,
        ...sampleData,
      });
      navigate('/lab/orders');
    } catch (error) {
      console.error('Error collecting sample:', error);
      alert('Failed to collect sample');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600 font-medium">{order.patientName}</p>
        <p className="text-sm text-gray-500">
          Patient ID: {order.patientId} • Ordered by Dr. {order.doctorName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tests to Collect */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Select Tests to Collect Sample</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {order.tests.map((test) => (
              <div
                key={test.id}
                className={`p-4 flex items-center justify-between ${
                  test.status !== 'PENDING' ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {test.status === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleTest(test.id)}
                      className="rounded border-gray-300"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-500">Sample: {test.sampleType}</div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    test.status === 'SAMPLE_COLLECTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {test.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Collection Time</label>
              <input
                type="datetime-local"
                value={sampleData.collectionTime}
                onChange={(e) =>
                  setSampleData({ ...sampleData, collectionTime: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Collected By</label>
              <input
                type="text"
                value={sampleData.collectedBy}
                onChange={(e) =>
                  setSampleData({ ...sampleData, collectedBy: e.target.value })
                }
                placeholder="Lab Technician Name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={sampleData.notes}
                onChange={(e) => setSampleData({ ...sampleData, notes: e.target.value })}
                rows={2}
                placeholder="Any observations about the sample..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
          </div>
        </div>

        {/* Barcode Generation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📋</div>
            <div>
              <h3 className="font-medium text-blue-900">Sample Barcode</h3>
              <p className="text-sm text-blue-700">
                A unique barcode will be generated for each sample upon submission.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/lab/orders')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || selectedTests.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Confirm Sample Collection'}
          </button>
        </div>
      </form>
    </div>
  );
}
