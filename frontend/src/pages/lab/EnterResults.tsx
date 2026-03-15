import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface TestResult {
  testId: string;
  testName: string;
  unit?: string;
  referenceRange?: string;
  value: string;
  interpretation: string;
  notes: string;
}

interface LabOrder {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  tests: {
    id: string;
    name: string;
    status: string;
    sampleType: string;
  }[];
}

export default function EnterResults() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/lab/orders/${orderId}`);
      setOrder(response.data);
      // Initialize results for each test
      const initialResults = response.data.tests
        .filter((t: { status: string }) => t.status === 'SAMPLE_COLLECTED' || t.status === 'IN_PROGRESS')
        .map((t: { id: string; name: string }) => ({
          testId: t.id,
          testName: t.name,
          value: '',
          interpretation: 'NORMAL',
          notes: '',
        }));
      setResults(initialResults);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (testId: string, field: keyof TestResult, value: string) => {
    setResults(
      results.map((r) =>
        r.testId === testId ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || results.length === 0) return;

    // Validate all results have values
    const incompleteResults = results.filter((r) => !r.value);
    if (incompleteResults.length > 0) {
      alert('Please enter values for all tests');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/lab/orders/${orderId}/results`, { results });
      navigate('/lab/orders');
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Failed to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'NORMAL':
        return 'bg-green-100 text-green-800';
      case 'ABNORMAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        {/* Results Entry */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <div key={result.testId} className="p-4">
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900">{result.testName}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Value</label>
                    <input
                      type="text"
                      value={result.value}
                      onChange={(e) => updateResult(result.testId, 'value', e.target.value)}
                      placeholder="Enter result value"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interpretation</label>
                    <select
                      value={result.interpretation}
                      onChange={(e) => updateResult(result.testId, 'interpretation', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="ABNORMAL">Abnormal</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <input
                      type="text"
                      value={result.notes}
                      onChange={(e) => updateResult(result.testId, 'notes', e.target.value)}
                      placeholder="Optional notes"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Interpretation Guide */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Interpretation Guide</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 text-xs rounded ${getInterpretationColor('NORMAL')}`}>
              Normal - Within reference range
            </span>
            <span className={`px-2 py-1 text-xs rounded ${getInterpretationColor('ABNORMAL')}`}>
              Abnormal - Outside reference range
            </span>
            <span className={`px-2 py-1 text-xs rounded ${getInterpretationColor('CRITICAL')}`}>
              Critical - Requires immediate attention
            </span>
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
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Results'}
          </button>
        </div>
      </form>
    </div>
  );
}
