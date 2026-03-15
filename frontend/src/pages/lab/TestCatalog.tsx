import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Test {
  id: string;
  name: string;
  category: string;
  sampleType: string;
  turnaroundTime: string;
  price: number;
  description: string;
  preparationRequired: string;
  isActive: boolean;
}

export default function TestCatalog() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sampleType: '',
    turnaroundTime: '',
    price: '',
    description: '',
    preparationRequired: '',
  });

  useEffect(() => {
    fetchTests();
  }, [categoryFilter]);

  const fetchTests = async () => {
    try {
      const params = categoryFilter !== 'all' ? `?category=${categoryFilter}` : '';
      const response = await api.get(`/lab/tests/catalog${params}`);
      setTests(response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await api.put(`/lab/tests/${editingTest.id}`, formData);
      } else {
        await api.post('/lab/tests', formData);
      }
      setShowModal(false);
      setEditingTest(null);
      resetForm();
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test');
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      category: test.category,
      sampleType: test.sampleType,
      turnaroundTime: test.turnaroundTime,
      price: test.price.toString(),
      description: test.description,
      preparationRequired: test.preparationRequired,
    });
    setShowModal(true);
  };

  const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/lab/tests/${testId}`, { isActive: !currentStatus });
      fetchTests();
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      sampleType: '',
      turnaroundTime: '',
      price: '',
      description: '',
      preparationRequired: '',
    });
  };

  const filteredTests = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(tests.map((t) => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setEditingTest(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Test
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No tests found
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className={`bg-white rounded-lg shadow overflow-hidden ${
                !test.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{test.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      test.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {test.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{test.category}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sample:</span>
                    <span className="text-gray-700">{test.sampleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TAT:</span>
                    <span className="text-gray-700">{test.turnaroundTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-gray-900">₹{test.price}</span>
                  </div>
                </div>
                {test.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{test.description}</p>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(test)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleTestStatus(test.id, test.isActive)}
                  className={`text-sm ${
                    test.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                  }`}
                >
                  {test.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTest ? 'Edit Test' : 'Add New Test'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Test Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Hematology, Biochemistry"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sample Type</label>
                <input
                  type="text"
                  value={formData.sampleType}
                  onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                  placeholder="e.g., Blood, Urine"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Turnaround Time</label>
                  <input
                    type="text"
                    value={formData.turnaroundTime}
                    onChange={(e) => setFormData({ ...formData, turnaroundTime: e.target.value })}
                    placeholder="e.g., 24 hours"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preparation Required</label>
                <textarea
                  value={formData.preparationRequired}
                  onChange={(e) => setFormData({ ...formData, preparationRequired: e.target.value })}
                  rows={2}
                  placeholder="e.g., Fasting required for 12 hours"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTest(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
