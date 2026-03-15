import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medicines: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    available: boolean;
    dispensed: boolean;
  }[];
  status: string;
}

export default function PendingPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/pharmacy/prescriptions/pending');
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUrgencyColor = (date: string) => {
    const hoursSincePrescribed =
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hoursSincePrescribed > 2) return 'bg-red-50 border-red-200';
    if (hoursSincePrescribed > 1) return 'bg-yellow-50 border-yellow-200';
    return '';
  };

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
        <div className="text-sm text-gray-500">
          {prescriptions.length} pending
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by patient name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No pending prescriptions
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`bg-white rounded-lg shadow overflow-hidden border ${getUrgencyColor(prescription.date)}`}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{prescription.patientName}</h3>
                    <p className="text-sm text-gray-500">
                      ID: {prescription.patientId} • Dr. {prescription.doctorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(prescription.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">{prescription.diagnosis}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-3">
                  {prescription.medicines.length} medicine(s)
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {prescription.medicines.slice(0, 3).map((medicine, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded ${
                        medicine.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {medicine.name}
                      {!medicine.available && ' (Out of stock)'}
                    </span>
                  ))}
                  {prescription.medicines.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                      +{prescription.medicines.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/pharmacy/dispense/${prescription.id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Process
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
