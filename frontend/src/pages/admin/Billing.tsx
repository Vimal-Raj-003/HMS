import { useEffect, useState } from 'react';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  FileText,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Filter,
  Receipt,
  Eye,
} from 'lucide-react';
import api from '../../lib/api';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface Bill {
  id: string;
  billNumber: string;
  patientName: string;
  patientId: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
}

interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Map backend bill response to frontend Bill interface
const mapBill = (raw: any): Bill => ({
  id: raw.id,
  billNumber: raw.billNumber || '',
  patientName: raw.patient
    ? `${raw.patient.firstName} ${raw.patient.lastName}`
    : raw.patientName || 'Unknown',
  patientId: raw.patientId,
  date: raw.createdAt || raw.date,
  items: (raw.items || []).map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.rate ?? item.unitPrice ?? 0,
    total: item.amount ?? item.total ?? 0,
  })),
  subtotal: raw.subtotal ?? 0,
  tax: raw.tax ?? 0,
  discount: raw.discount ?? 0,
  total: raw.totalAmount ?? raw.total ?? 0,
  status: raw.status || 'PENDING',
  paymentMethod: raw.payments?.[0]?.paymentMethod || raw.paymentMethod || '',
});

export default function Billing() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBills();
  }, [filter]);

  const fetchBills = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/billing/bills${params}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setBills(data.map(mapBill));
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (billId: string, paymentMethod: string) => {
    try {
      await api.post(`/billing/bills/${billId}/payment`, { paymentMethod, amount: selectedBill?.total || 0 });
      fetchBills();
      setShowModal(false);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' };
      case 'PAID':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Paid' };
      case 'PARTIALLY_PAID':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Partial' };
      case 'CANCELLED':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' };
      case 'REFUNDED':
        return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Refunded' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: status };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const pendingTotal = bills.filter(b => b.status === 'PENDING').reduce((acc, b) => acc + b.total, 0);
  const paidTotal = bills.filter(b => b.status === 'PAID').reduce((acc, b) => acc + b.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-400" />
          <span className="text-sm text-secondary-600 dark:text-gray-400">
            Showing {filter === 'all' ? 'all bills' : filter.toLowerCase().replace('_', ' ') + ' bills'}
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border-secondary-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm text-secondary-900 dark:text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-gray-700 shadow-card p-5 hover:shadow-card-hover transition-all duration-200 group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 ring-4 ring-amber-500/20 group-hover:scale-110 transition-transform duration-200">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{formatCurrency(pendingTotal)}</p>
          <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">Total Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-gray-700 shadow-card p-5 hover:shadow-card-hover transition-all duration-200 group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/20 group-hover:scale-110 transition-transform duration-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{formatCurrency(paidTotal)}</p>
          <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">Collected Today</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary-200 dark:border-gray-700 shadow-card p-5 hover:shadow-card-hover transition-all duration-200 group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 ring-4 ring-blue-500/20 group-hover:scale-110 transition-transform duration-200">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{bills.length}</p>
          <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">Total Bills</p>
        </div>
      </div>

      {/* Bills Table */}
      <CollapsibleCard
        title="Bills"
        subtitle="All billing records"
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        iconBgColor="bg-indigo-100"
        defaultCollapsed={false}
        collapsedContent={
          <span className="text-sm text-secondary-600">{bills.length} bills</span>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-secondary-50/80 dark:bg-gray-800/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Bill ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-gray-700">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Receipt className="w-10 h-10 text-secondary-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-secondary-500 dark:text-gray-400">No bills found</p>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const statusCfg = getStatusConfig(bill.status);
                  return (
                    <tr key={bill.id} className="hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono font-medium text-secondary-900 dark:text-gray-100">
                          {bill.billNumber || `#${bill.id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-secondary-900 dark:text-gray-100">{bill.patientName}</div>
                        <div className="text-xs text-secondary-500 dark:text-gray-400">ID: {bill.patientId}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary-700 dark:text-gray-300">
                        {new Date(bill.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-semibold text-secondary-900 dark:text-gray-100">
                        {formatCurrency(bill.total)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedBill(bill); setShowModal(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          {bill.status === 'PENDING' && (
                            <button
                              onClick={() => handlePayment(bill.id, 'CASH')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>

      {/* Bill Detail Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-secondary-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary-900 dark:text-gray-100">Bill Details</h2>
                  <p className="text-xs text-secondary-500 dark:text-gray-400">
                    #{selectedBill.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-lg bg-secondary-100 dark:bg-gray-700 flex items-center justify-center text-secondary-500 hover:bg-secondary-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Bill Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Bill ID', value: `#${selectedBill.id.slice(-8).toUpperCase()}` },
                  { label: 'Date', value: new Date(selectedBill.date).toLocaleDateString() },
                  { label: 'Patient', value: selectedBill.patientName },
                  { label: 'Status', value: selectedBill.status, isStatus: true },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-secondary-50 dark:bg-gray-700/50">
                    <p className="text-xs text-secondary-500 dark:text-gray-400 mb-1">{item.label}</p>
                    {item.isStatus ? (
                      (() => {
                        const cfg = getStatusConfig(item.value);
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        );
                      })()
                    ) : (
                      <p className="font-medium text-sm text-secondary-900 dark:text-gray-100">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-gray-100 mb-3">Line Items</h3>
                <div className="rounded-xl border border-secondary-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary-50/80 dark:bg-gray-800/80">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Description</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-gray-700">
                      {selectedBill.items.map((item, index) => (
                        <tr key={index} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                          <td className="px-4 py-2.5 text-sm text-secondary-900 dark:text-gray-100">{item.description}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-secondary-700 dark:text-gray-300">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-secondary-700 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-sm text-right font-medium text-secondary-900 dark:text-gray-100">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-secondary-50 dark:bg-gray-700/50 p-4 space-y-2">
                <div className="flex justify-between text-sm text-secondary-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-secondary-700 dark:text-gray-300">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedBill.tax)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-secondary-900 dark:text-gray-100 pt-2 border-t border-secondary-200 dark:border-gray-600">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBill.total)}</span>
                </div>
              </div>

              {/* Payment Actions */}
              {selectedBill.status === 'PENDING' && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-secondary-900 dark:text-gray-100 mb-3">Process Payment</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handlePayment(selectedBill.id, 'CASH')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-secondary-200 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700 dark:text-gray-300">Cash</span>
                    </button>
                    <button
                      onClick={() => handlePayment(selectedBill.id, 'CARD')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-secondary-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700 dark:text-gray-300">Card</span>
                    </button>
                    <button
                      onClick={() => handlePayment(selectedBill.id, 'UPI')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-secondary-200 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700 dark:text-gray-300">UPI</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
