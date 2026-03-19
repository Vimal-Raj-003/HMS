import { useEffect, useState } from 'react';
import { labAPI } from '../../lib/api';

interface Test {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  turnaroundHours: number;
  turnaroundTime: string;
  description?: string;
  sampleType?: string;
  preparationRequired?: string;
  isActive: boolean;
  parameters: string;
}

export default function TestCatalog() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    price: '',
    turnaroundHours: '',
    description: '',
    parameters: '',
  });

  useEffect(() => {
    fetchTests();
  }, [categoryFilter]);

  const fetchTests = async () => {
    try {
      const params: any = {};
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await labAPI.getTests(params);
      setTests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTests();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        turnaroundHours: parseInt(formData.turnaroundHours),
        description: formData.description,
        parameters: formData.parameters || '[]',
      };

      if (editingTest) {
        await labAPI.updateTest(editingTest.id, data);
      } else {
        await labAPI.createTest(data);
      }
      
      setShowModal(false);
      setEditingTest(null);
      resetForm();
      fetchTests();
    } catch (error: any) {
      console.error('Error saving test:', error);
      const message = error.response?.data?.message || 'Failed to save test';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      code: test.code,
      name: test.name,
      category: test.category,
      price: test.price.toString(),
      turnaroundHours: test.turnaroundHours?.toString() || '24',
      description: test.description || '',
      parameters: test.parameters || '',
    });
    setShowModal(true);
  };

  const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await labAPI.updateTestStatus(testId, !currentStatus);
      fetchTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      alert('Failed to update test status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      price: '',
      turnaroundHours: '',
      description: '',
      parameters: '',
    });
  };

  const filteredTests = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(tests.map((t) => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Test Catalog</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingTest(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Test
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
              />
              <button
                onClick={handleSearch}
                className="btn-secondary"
              >
                Search
              </button>
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
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
          <div className="col-span-full bg-white rounded-xl border border-secondary-200 shadow-card p-8 text-center text-secondary-500">
            No tests found
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className={`bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow ${
                !test.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-secondary-900">{test.name}</h3>
                    <p className="text-xs text-secondary-400">{test.code}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      test.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {test.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-secondary-500 mb-3">{test.category}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-400">TAT:</span>
                    <span className="text-secondary-700">{test.turnaroundTime || `${test.turnaroundHours} hrs`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-400">Price:</span>
                    <span className="font-medium text-secondary-900">₹{test.price}</span>
                  </div>
                </div>
                {test.description && (
                  <p className="text-xs text-secondary-400 mt-3 line-clamp-2">{test.description}</p>
                )}
              </div>
              <div className="px-4 py-3 bg-secondary-50 flex justify-end gap-3">
                <button
                  onClick={() => handleEdit(test)}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleTestStatus(test.id, test.isActive)}
                  className={`text-sm font-medium ${
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-secondary-900">
                {editingTest ? 'Edit Test' : 'Add New Test'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Test Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CBC, LFT"
                    className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                    required
                    disabled={!!editingTest}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Complete Blood Count"
                    className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Hematology, Biochemistry"
                  className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                  required
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Turnaround (hours) *</label>
                  <input
                    type="number"
                    value={formData.turnaroundHours}
                    onChange={(e) => setFormData({ ...formData, turnaroundHours: e.target.value })}
                    placeholder="e.g., 24"
                    className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                    required
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                  placeholder="Brief description of the test..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Parameters (JSON)</label>
                <textarea
                  value={formData.parameters}
                  onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 font-mono text-sm"
                  placeholder='[{"name":"Hemoglobin","unit":"g/dL","referenceRange":"12-16"}]'
                />
                <p className="text-xs text-secondary-400 mt-1">Optional: JSON array of test parameters</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTest(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 py-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingTest ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
