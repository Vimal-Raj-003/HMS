import { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';

interface BillItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

interface Bill {
  id: string;
  billNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string;
  };
  items: BillItem[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface BillsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface BillsResponse {
  bills: Bill[];
  pagination?: Pagination;
}

export default function PharmacyBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBills();
  }, [currentPage, dateFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params: BillsQueryParams = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      };

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

      const response = await pharmacyAPI.getBills(params);
      // The axios interceptor unwraps response.data from { success, data: {...} } to just the inner data
      // So response.data contains the actual bills array or { bills, pagination } object
      const data = response.data as any;
      // Handle both array response and object with bills/pagination
      if (Array.isArray(data)) {
        setBills(data);
        setPagination({ total: 0, page: 1, limit: 20, pages: 0 });
      } else {
        setBills(data.bills || data || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBills();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'partial':
        return 'bg-orange-100 text-orange-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  // HTML escape function to prevent XSS attacks
  const escapeHtml = (str: string | null | undefined): string => {
    if (str == null) return '';
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(str).replace(/[&<>"']/g, char => htmlEntities[char]);
  };

  const handleDownload = async (billId: string) => {
    try {
      const response = await pharmacyAPI.getBillForDownload(billId);
      // The axios interceptor unwraps response.data from { success, data: {...} } to just the inner data
      const data = response.data as any;
      
      // Create a printable bill
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bill - ${escapeHtml(data.bill.billNumber)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .hospital-name { font-size: 24px; font-weight: bold; }
              .hospital-address { color: #666; margin-top: 5px; }
              .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f5f5f5; }
              .totals { margin-top: 20px; text-align: right; }
              .totals div { margin: 5px 0; }
              .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
              .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hospital-name">${escapeHtml(data.hospital?.name) || 'Hospital'}</div>
              <div class="hospital-address">${escapeHtml(data.hospital?.address) || ''}</div>
            </div>
            
            <div class="bill-info">
              <div>
                <strong>Bill Number:</strong> ${escapeHtml(data.bill.billNumber)}<br>
                <strong>Date:</strong> ${formatDate(data.bill.createdAt)}
              </div>
              <div>
                <strong>Patient:</strong> ${escapeHtml(data.bill.patient.firstName)} ${escapeHtml(data.bill.patient.lastName)}<br>
                <strong>Patient ID:</strong> ${escapeHtml(data.bill.patient.patientNumber)}
              </div>
            </div>
            
            ${data.bill.prescription?.doctor ? `
            <div class="section">
              <div class="section-title">Doctor</div>
              Dr. ${escapeHtml(data.bill.prescription.doctor.firstName)} ${escapeHtml(data.bill.prescription.doctor.lastName)}
              ${data.bill.prescription.doctor.specialty ? ` (${escapeHtml(data.bill.prescription.doctor.specialty)})` : ''}
            </div>
            ` : ''}
            
            <div class="section">
              <div class="section-title">Medicines</div>
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.bill.items.map((item: any) => `
                    <tr>
                      <td>${escapeHtml(item.medicineName)}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(item.unitPrice)}</td>
                      <td>${formatCurrency(item.totalPrice)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="totals">
              <div>Subtotal: ${formatCurrency(data.bill.subtotal)}</div>
              <div>Tax (5% GST): ${formatCurrency(data.bill.tax)}</div>
              ${data.bill.discount > 0 ? `<div>Discount: -${formatCurrency(data.bill.discount)}</div>` : ''}
              <div class="grand-total">Grand Total: ${formatCurrency(data.bill.totalAmount)}</div>
            </div>
            
            <div class="footer">
              <p>Thank you for your visit!</p>
              <p>Payment Method: ${escapeHtml(data.bill.paymentMethod.toUpperCase())}</p>
            </div>
            
            <script>window.print();</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      alert('Failed to generate bill');
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
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Pharmacy Bills</h1>
          <p className="text-secondary-600">{pagination.total} bills found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by bill number, patient name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {bills.length === 0 ? (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <h3 className="text-lg font-semibold text-secondary-900">No Bills Found</h3>
            <p className="text-secondary-500 mt-1">No pharmacy bills match your criteria</p>
          </div>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Receipt className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-secondary-900">{bill.billNumber}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(bill.paymentStatus)}`}>
                        {bill.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-secondary-600">
                      <span>{bill.patient.firstName} {bill.patient.lastName}</span>
                      <span>({bill.patient.patientNumber})</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(bill.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-secondary-900">{formatCurrency(bill.totalAmount)}</p>
                    <p className="text-xs text-secondary-500">{bill.items.length} items • {bill.paymentMethod.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBill(selectedBill?.id === bill.id ? null : bill)}
                      className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 text-secondary-600"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(bill.id)}
                      className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50 text-secondary-600"
                      title="Download Bill"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {selectedBill?.id === bill.id && (
                <div className="border-t border-secondary-200 p-4 bg-secondary-50">
                  <h4 className="text-sm font-medium text-secondary-700 mb-3">Bill Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-secondary-600">
                          <th className="pb-2">Medicine</th>
                          <th className="pb-2">Batch</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-secondary-900">
                        {bill.items.map((item) => (
                          <tr key={item.id} className="border-t border-secondary-200">
                            <td className="py-2">{item.medicineName}</td>
                            <td className="py-2 text-secondary-500">{item.batchNumber || '-'}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-secondary-200 flex justify-end">
                    <div className="text-right space-y-1">
                      <div className="flex justify-between gap-8 text-sm">
                        <span className="text-secondary-600">Subtotal</span>
                        <span>{formatCurrency(bill.subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-8 text-sm">
                        <span className="text-secondary-600">Tax (5% GST)</span>
                        <span>{formatCurrency(bill.tax)}</span>
                      </div>
                      {bill.discount > 0 && (
                        <div className="flex justify-between gap-8 text-sm">
                          <span className="text-secondary-600">Discount</span>
                          <span className="text-green-600">-{formatCurrency(bill.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-8 text-lg font-bold pt-2 border-t border-secondary-200">
                        <span>Total</span>
                        <span className="text-primary-600">{formatCurrency(bill.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-secondary-200 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-secondary-600">
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-1 rounded border border-secondary-200 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
