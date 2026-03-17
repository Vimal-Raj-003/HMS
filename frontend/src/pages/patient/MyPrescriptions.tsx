import { useEffect, useState } from 'react';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import PrescriptionModal from '../../components/patient/PrescriptionModal';
import {
  FileText,
  Calendar,
  Pill,
  AlertCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  ClipboardList,
  CheckCircle,
  Package,
  Eye
} from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  specialization: string;
  diagnosis: string;
  medicines: Medicine[];
  status: string;
  // New document fields
  prescriptionFileUrl?: string;
  notes?: string;
}

// Dummy data removed - all data comes from patient-specific API calls

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending',
        description: 'Not yet collected from pharmacy'
      };
    case 'DISPENSED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Dispensed',
        description: 'All medicines collected'
      };
    case 'PARTIALLY_DISPENSED':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: Package,
        label: 'Partially Dispensed',
        description: 'Some medicines collected'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: AlertCircle,
        label: status,
        description: ''
      };
  }
};

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [filter, setFilter] = useState('all');
  
  // Modal state for detailed prescription view
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [filter]);

  const fetchPrescriptions = async () => {
    try {
      const response = await patientPortalAPI.getPrescriptions(filter !== 'all' ? filter : undefined);
      // Only use data from the API - no dummy data fallback
      // This ensures patient data isolation
      setPrescriptions(response.data || []);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast.error(error.response?.data?.message || 'Failed to load prescriptions');
      // Set empty prescriptions on error - no dummy data
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    // Open the detailed prescription modal
    setSelectedPrescriptionId(prescription.id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPrescriptionId(null);
  };

  // Opens the prescription modal which contains PDF download functionality
  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescriptionId(prescription.id);
    setModalOpen(true);
  };

  const filteredPrescriptions = filter === 'all' 
    ? prescriptions 
    : prescriptions.filter(p => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-500 mt-1">View and download your prescriptions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all bg-white"
          >
            <option value="all">All Prescriptions</option>
            <option value="PENDING">Pending</option>
            <option value="DISPENSED">Dispensed</option>
            <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
          </select>
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No prescriptions available</h3>
          <p className="text-gray-500">Your prescriptions will appear here once issued by your doctor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => {
            const statusConfig = getStatusConfig(prescription.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = selectedPrescription?.id === prescription.id;

            return (
              <div key={prescription.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Prescription Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedPrescription(isExpanded ? null : prescription)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
                        <Pill className={`w-6 h-6 ${statusConfig.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(prescription.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">Dr. {prescription.doctorName}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Stethoscope className="w-4 h-4" />
                            {prescription.specialization}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span>{prescription.medicines.length} medicines</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPrescription(prescription);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-[#14B8A6] text-[#14B8A6] rounded-lg font-medium hover:bg-[#14B8A6]/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(prescription);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* Diagnosis */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-700">Diagnosis</h4>
                      </div>
                      <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {prescription.diagnosis}
                      </p>
                    </div>

                    {/* Medicines */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-4 h-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-700">Prescribed Medicines</h4>
                      </div>
                      <div className="space-y-3">
                        {prescription.medicines.map((medicine, index) => (
                          <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-xs font-medium text-[#2563EB]">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-gray-900">{medicine.name}</span>
                                </div>
                                <div className="ml-8 space-y-1">
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                    <span><strong>Dosage:</strong> {medicine.dosage}</span>
                                    <span><strong>Frequency:</strong> {medicine.frequency}</span>
                                    <span><strong>Duration:</strong> {medicine.duration}</span>
                                  </div>
                                  {medicine.instructions && (
                                    <div className="flex items-start gap-1 text-xs text-gray-500 mt-1">
                                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      <span>{medicine.instructions}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {prescription.notes && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Doctor's Notes</p>
                            <p className="text-sm text-blue-700 mt-0.5">{prescription.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Info */}
                    <div className={`p-3 rounded-xl ${statusConfig.bg} mb-4`}>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                        <div>
                          <p className={`text-sm font-medium ${statusConfig.text}`}>{statusConfig.label}</p>
                          <p className={`text-xs ${statusConfig.text} opacity-75`}>{statusConfig.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-end gap-3">
                      {prescription.status === 'PENDING' && (
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors">
                          <Package className="w-4 h-4" />
                          Request Home Delivery
                        </button>
                      )}
                      <div className="flex items-center gap-2 sm:hidden">
                        <button
                          onClick={() => handleViewPrescription(prescription)}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-[#14B8A6] text-[#14B8A6] rounded-lg font-medium hover:bg-[#14B8A6]/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleViewDetails(prescription)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Prescriptions</p>
          <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{prescriptions.filter(p => p.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Dispensed</p>
          <p className="text-2xl font-bold text-green-600">{prescriptions.filter(p => p.status === 'DISPENSED').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Medicines</p>
          <p className="text-2xl font-bold text-[#2563EB]">{prescriptions.reduce((acc, p) => acc + p.medicines.length, 0)}</p>
        </div>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        prescriptionId={selectedPrescriptionId}
      />
    </div>
  );
}
