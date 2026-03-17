import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  IndianRupee,
  Calendar,
  Trash2,
  Edit,
  X,
  Loader2
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';

interface Expense {
  id: string;
  expenseCategory: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptNumber: string | null;
  supplierName: string | null;
  notes: string | null;
  createdAt: string;
}

interface ExpensesQueryParams {
  category?: string;
  startDate?: string;
  endDate?: string;
}

interface ExpensesSummary {
  totalAmount: number;
}

interface ExpensesResponse {
  expenses: Expense[];
  summary?: ExpensesSummary;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [summary, setSummary] = useState({ totalAmount: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    expenseCategory: 'Medicine Purchase',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    supplierName: '',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, dateFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: ExpensesQueryParams = {};
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
        params.endDate = new Date().toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
        params.endDate = new Date().toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
        params.endDate = new Date().toISOString();
      }

      const response = await pharmacyAPI.getExpenses(params);
      // The axios interceptor unwraps response.data from { success, data: {...} } to just the inner data
      const data = response.data as ExpensesResponse | Expense[];
      // Handle both array response and object with expenses/summary
      if (Array.isArray(data)) {
        setExpenses(data);
        setSummary({ totalAmount: 0 });
      } else {
        setExpenses(data.expenses || []);
        setSummary(data.summary || { totalAmount: 0 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount before parsing
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingExpense) {
        await pharmacyAPI.updateExpense(editingExpense.id, {
          ...formData,
          amount,
        });
      } else {
        await pharmacyAPI.createExpense({
          ...formData,
          amount,
        });
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      alert(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await pharmacyAPI.deleteExpense(id);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseCategory: expense.expenseCategory,
      description: expense.description,
      amount: expense.amount.toString(),
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      receiptNumber: expense.receiptNumber || '',
      supplierName: expense.supplierName || '',
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      expenseCategory: 'Medicine Purchase',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      supplierName: '',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Medicine Purchase': 'bg-blue-100 text-blue-700',
      'Operational Cost': 'bg-green-100 text-green-700',
      'Equipment': 'bg-purple-100 text-purple-700',
      'Miscellaneous': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-secondary-100 text-secondary-700';
  };

  const filteredExpenses = expenses.filter((expense: Expense) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(search) ||
      expense.expenseCategory.toLowerCase().includes(search) ||
      (expense.supplierName?.toLowerCase().includes(search) || false)
    );
  });

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Expense Tracking</h1>
          <p className="text-secondary-600">Track and manage pharmacy expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100">
              <IndianRupee className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Expenses</p>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">This Month</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(
                  expenses
                    .filter((e: Expense) => {
                      const expenseDate = new Date(e.expenseDate);
                      const now = new Date();
                      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                      return expenseDate >= monthStart;
                    })
                    .reduce((sum: number, e: Expense) => sum + e.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Today</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(
                  expenses
                    .filter((e: Expense) => {
                      const expenseDate = new Date(e.expenseDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return expenseDate >= today;
                    })
                    .reduce((sum: number, e: Expense) => sum + e.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="Medicine Purchase">Medicine Purchase</option>
            <option value="Operational Cost">Operational Cost</option>
            <option value="Equipment">Equipment</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                    <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No expenses recorded</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense: Expense) => (
                  <tr key={expense.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-secondary-900">{formatDate(expense.expenseDate)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(expense.expenseCategory)}`}>
                        {expense.expenseCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-secondary-900">{expense.description}</p>
                      {expense.receiptNumber && (
                        <p className="text-xs text-secondary-500">Receipt: {expense.receiptNumber}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="font-medium text-secondary-900">{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-secondary-600">{expense.supplierName || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                  resetForm();
                }}
                className="p-1 hover:bg-secondary-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Category *</label>
                <select
                  value={formData.expenseCategory}
                  onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="Medicine Purchase">Medicine Purchase</option>
                  <option value="Operational Cost">Operational Cost</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Amount *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
