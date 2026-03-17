import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  User,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';

interface MedicineItem {
  id: string;
  medicineId: string;
  medicine: {
    id: string;
    name: string;
    genericName: string | null;
    price: number;
    category: string;
  };
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string | null;
  isDispensed: boolean;
  available: boolean;
  unitPrice: number;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
  };
  doctor: {
    firstName: string;
    lastName: string;
    specialty: string | null;
  };
  consultation?: {
    provisionalDiagnosis: string | null;
  };
  items: MedicineItem[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface PrescriptionsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface PrescriptionsResponse {
  prescriptions: Prescription[];
  pagination?: Pagination;
}

export default function PendingPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPrescriptions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrescriptions, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchPrescriptions = async () => {
    try {
      const response = await pharmacyAPI.getPendingPrescriptions({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      });
      // The axios interceptor unwraps response.data from { success, data: {...} } to just the inner data
      // So response.data contains the actual prescriptions array or { prescriptions, pagination } object
      const responseData = response.data as PrescriptionsResponse | Prescription[];
      // Handle both array response and object with prescriptions/pagination
      if (Array.isArray(responseData)) {
        setPrescriptions(responseData);
        setPagination({ total: 0, page: 1, limit: 20, pages: 0 });
      } else {
        setPrescriptions(responseData.prescriptions || []);
        setPagination(responseData.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPrescriptions();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getUrgencyLevel = (date: string) => {
    const hoursSincePrescribed = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hoursSincePrescribed > 2) return { level: 'urgent', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' };
    if (hoursSincePrescribed > 1) return { level: 'moderate', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' };
    return { level: 'normal', color: 'bg-white border-secondary-200', badge: 'bg-secondary-100 text-secondary-700' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAvailableCount = (items: MedicineItem[]) => {
    return items.filter(item => item.available).length;
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
          <h1 className="text-2xl font-bold text-secondary-900">Prescription Queue</h1>
          <p className="text-secondary-600">
            {pagination.total} prescription{pagination.total !== 1 ? 's' : ''} pending dispensing
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or prescription number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <h3 className="text-lg font-semibold text-secondary-900">No Pending Prescriptions</h3>
            <p className="text-secondary-500 mt-1">All prescriptions have been processed</p>
          </div>
        ) : (
          prescriptions.map((prescription) => {
            const urgency = getUrgencyLevel(prescription.createdAt);
            const isExpanded = expandedId === prescription.id;
            const availableCount = getAvailableCount(prescription.items);
            const allAvailable = availableCount === prescription.items.length;
            
            return (
              <div
                key={prescription.id}
                className={`bg-white rounded-xl border shadow-card overflow-hidden transition-all ${urgency.color}`}
              >
                {/* Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-secondary-50"
                  onClick={() => toggleExpand(prescription.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary-100">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-secondary-900">
                            {prescription.patient.firstName} {prescription.patient.lastName}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${urgency.badge}`}>
                            {formatTime(prescription.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {prescription.patient.patientNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}
                            {prescription.doctor.specialty && ` (${prescription.doctor.specialty})`}
                          </span>
                          <span className="flex items-center gap-1">
                            {calculateAge(prescription.patient.dateOfBirth)} yrs • {prescription.patient.gender}
                          </span>
                        </div>
                        {prescription.consultation?.provisionalDiagnosis && (
                          <p className="text-sm text-secondary-500 mt-1">
                            {prescription.consultation.provisionalDiagnosis}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Pill className="w-4 h-4 text-secondary-400" />
                          <span className="font-medium text-secondary-900">{prescription.items.length}</span>
                          <span className="text-secondary-500 text-sm">items</span>
                        </div>
                        {!allAvailable && (
                          <span className="text-xs text-red-600 flex items-center gap-1 justify-end">
                            <AlertCircle className="w-3 h-3" />
                            {availableCount}/{prescription.items.length} available
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-secondary-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-secondary-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-secondary-200 p-4 bg-secondary-50">
                    {/* Patient Contact */}
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <p className="text-sm text-secondary-600">
                        <span className="font-medium">Contact:</span> {prescription.patient.phone}
                      </p>
                    </div>

                    {/* Medicines List */}
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-secondary-700">Medicines</h4>
                      {prescription.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg ${
                            item.isDispensed 
                              ? 'bg-green-50 border border-green-200' 
                              : !item.available 
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-white border border-secondary-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-secondary-900">{item.medicine.name}</span>
                                {item.isDispensed ? (
                                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Dispensed
                                  </span>
                                ) : !item.available ? (
                                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Out of Stock
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-secondary-600">
                                {item.dosage} • {item.frequency} • {item.durationDays} days
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-secondary-500">
                                <span>Qty: {item.quantity}</span>
                                <span>₹{item.unitPrice.toFixed(2)}/unit</span>
                                {item.instructions && <span>Note: {item.instructions}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-secondary-900">
                                ₹{(item.unitPrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                      <div>
                        <p className="text-sm text-secondary-600">
                          Estimated Total
                        </p>
                        <p className="text-xl font-bold text-secondary-900">
                          ₹{prescription.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-4 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-100"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => navigate(`/pharmacy/dispense/${prescription.id}`)}
                          className="btn-primary inline-flex items-center gap-2"
                          disabled={availableCount === 0}
                        >
                          <Pill className="w-4 h-4" />
                          Dispense {availableCount > 0 && availableCount < prescription.items.length ? `(${availableCount})` : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
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
