import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  parameters?: string;
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
  status: string;
  tests: Test[];
  sampleCollectedAt?: string;
}

interface ResultEntry {
  itemId: string;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  interpretation: 'normal' | 'abnormal' | 'critical';
  isCritical: boolean;
}

export default function EnterResults() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        selectOrder(order);
      }
    }
  }, [orderId, orders]);

  const fetchPendingResults = async () => {
    try {
      // Get orders that have samples collected, are in processing, or completed
      const response = await labAPI.getOrders({ status: 'sample_collected' });
      const processingResponse = await labAPI.getOrders({ status: 'processing' });
      const completedResponse = await labAPI.getOrders({ status: 'completed' });
      
      const allOrders = [
        ...(Array.isArray(response.data) ? response.data : []),
        ...(Array.isArray(processingResponse.data) ? processingResponse.data : []),
        ...(Array.isArray(completedResponse.data) ? completedResponse.data : [])
      ];
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching pending results:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: LabOrder) => {
    setSelectedOrder(order);
    
    // For completed orders, show all tests with their results (read-only view)
    // For pending/processing orders, only show tests that need results
    const isCompleted = order.status.toLowerCase() === 'completed';
    
    const initialResults: ResultEntry[] = order.tests
      .filter(t => isCompleted || t.status.toLowerCase() !== 'completed')
      .map(t => ({
        itemId: t.id,
        testName: t.name,
        resultValue: t.resultValue || '',
        unit: t.unit || '',
        referenceRange: t.referenceRange || '',
        interpretation: (t.interpretation as 'normal' | 'abnormal' | 'critical') || 'normal',
        isCritical: t.isCritical || false,
      }));
    
    setResults(initialResults);
    
    // Update URL
    navigate(`/lab/results/${order.id}`, { replace: true });
  };

  const updateResult = (itemId: string, field: keyof ResultEntry, value: string | boolean) => {
    setResults(prev => prev.map(r => {
      if (r.itemId !== itemId) return r;
      
      const updated = { ...r, [field]: value };
      
      // Auto-set isCritical based on interpretation
      if (field === 'interpretation') {
        updated.isCritical = value === 'critical';
      }
      
      return updated;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || results.length === 0) return;

    // Validate all results have values
    const incompleteResults = results.filter(r => !r.resultValue.trim());
    if (incompleteResults.length > 0) {
      alert('Please enter values for all tests');
      return;
    }

    setSubmitting(true);
    try {
      await labAPI.submitResults(selectedOrder.id, {
        results: results.map(r => ({
          itemId: r.itemId,
          resultValue: r.resultValue,
          unit: r.unit,
          referenceRange: r.referenceRange,
          interpretation: r.interpretation,
          isCritical: r.isCritical,
          testName: r.testName,
        })),
      });
      
      // Refresh the list
      await fetchPendingResults();
      
      // Clear selection and navigate back to list
      setSelectedOrder(null);
      setResults([]);
      navigate('/lab/results', { replace: true });
      
      alert('Results submitted successfully!');
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Failed to submit results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'abnormal':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
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
        return 'bg-red-700 text-white animate-pulse';
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
      <h1 className="text-2xl font-bold text-secondary-900">Enter Lab Results</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-secondary-200 bg-secondary-50">
              <h2 className="font-semibold text-secondary-900">Results Entry</h2>
              <p className="text-sm text-secondary-500">{orders.length} orders</p>
            </div>
            <div className="divide-y divide-secondary-200 max-h-[600px] overflow-y-auto">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-secondary-500">
                  No orders found
                </div>
              ) : (
                orders.map(order => {
                  const isCompleted = order.status.toLowerCase() === 'completed';
                  return (
                    <button
                      key={order.id}
                      onClick={() => selectOrder(order)}
                      className={`w-full p-4 text-left hover:bg-secondary-50 transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-secondary-900">{order.patientName}</span>
                        <div className="flex gap-1">
                          {isCompleted && (
                            <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-secondary-500">
                        {order.orderNumber} • {order.tests.length} test(s)
                      </div>
                      <div className="text-xs text-secondary-400 mt-1">
                        Collected: {order.sampleCollectedAt ? new Date(order.sampleCollectedAt).toLocaleString() : 'N/A'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Results Entry Form */}
        <div className="lg:col-span-2">
          {!selectedOrder ? (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-8 text-center text-secondary-500">
              Select an order from the list to view or enter results
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Info */}
              <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-secondary-900">{selectedOrder.patientName}</h3>
                    <p className="text-sm text-secondary-500">
                      {selectedOrder.patientNumber} • {selectedOrder.doctorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedOrder.status.toLowerCase() === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status.toLowerCase() === 'processing'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results Entry/View */}
              <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
                <div className="p-4 border-b border-secondary-200 bg-secondary-50">
                  <h2 className="font-semibold text-secondary-900">
                    {selectedOrder.status.toLowerCase() === 'completed' ? 'Test Results (View Only)' : 'Test Results'}
                  </h2>
                </div>
                <div className="divide-y divide-secondary-200">
                  {results.length === 0 ? (
                    <div className="p-8 text-center text-secondary-500">
                      No results available
                    </div>
                  ) : (
                    results.map((result) => {
                      const isCompleted = selectedOrder.status.toLowerCase() === 'completed';
                      return (
                        <div key={result.itemId} className="p-4">
                          <div className="mb-3 flex justify-between items-center">
                            <h4 className="font-medium text-secondary-900">{result.testName}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getInterpretationColor(result.interpretation)}`}>
                              {result.interpretation.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">Result Value *</label>
                              <input
                                type="text"
                                value={result.resultValue}
                                onChange={(e) => updateResult(result.itemId, 'resultValue', e.target.value)}
                                placeholder="Enter value"
                                className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 disabled:bg-secondary-100 disabled:text-secondary-700"
                                required
                                disabled={isCompleted}
                                readOnly={isCompleted}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                              <input
                                type="text"
                                value={result.unit}
                                onChange={(e) => updateResult(result.itemId, 'unit', e.target.value)}
                                placeholder="e.g., mg/dL"
                                className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 disabled:bg-secondary-100 disabled:text-secondary-700"
                                disabled={isCompleted}
                                readOnly={isCompleted}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">Reference Range</label>
                              <input
                                type="text"
                                value={result.referenceRange}
                                onChange={(e) => updateResult(result.itemId, 'referenceRange', e.target.value)}
                                placeholder="e.g., 70-100"
                                className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 disabled:bg-secondary-100 disabled:text-secondary-700"
                                disabled={isCompleted}
                                readOnly={isCompleted}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">Interpretation</label>
                              <select
                                value={result.interpretation}
                                onChange={(e) => updateResult(result.itemId, 'interpretation', e.target.value)}
                                className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 disabled:bg-secondary-100 disabled:text-secondary-700"
                                disabled={isCompleted}
                              >
                                <option value="normal">Normal</option>
                                <option value="abnormal">Abnormal</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Interpretation Guide */}
              <div className="bg-secondary-50 rounded-xl p-4">
                <h4 className="font-medium text-secondary-900 mb-2">Interpretation Guide</h4>
                <div className="flex flex-wrap gap-3">
                  <span className={`px-3 py-1 text-sm rounded-full ${getInterpretationColor('normal')}`}>
                    Normal - Within reference range
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full ${getInterpretationColor('abnormal')}`}>
                    Abnormal - Outside reference range
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full ${getInterpretationColor('critical')}`}>
                    Critical - Requires immediate attention
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setResults([]);
                    navigate('/lab/results', { replace: true });
                  }}
                  className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  {selectedOrder.status.toLowerCase() === 'completed' ? 'Back' : 'Cancel'}
                </button>
                {selectedOrder.status.toLowerCase() !== 'completed' && (
                  <button
                    type="submit"
                    disabled={submitting || results.length === 0}
                    className="btn-primary px-6 py-2 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Results'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
