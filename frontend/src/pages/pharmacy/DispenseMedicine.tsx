import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  available: boolean;
  dispensed: boolean;
  stockId?: string;
  unitPrice: number;
}

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medicines: Medicine[];
}

export default function DispenseMedicine() {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      const response = await api.get(`/pharmacy/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
      // Pre-select all available medicines
      setSelectedMedicines(
        response.data.medicines
          .filter((m: Medicine) => m.available && !m.dispensed)
          .map((m: Medicine) => m.id)
      );
    } catch (error) {
      console.error('Error fetching prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMedicine = (medicineId: string) => {
    if (selectedMedicines.includes(medicineId)) {
      setSelectedMedicines(selectedMedicines.filter((id) => id !== medicineId));
    } else {
      setSelectedMedicines([...selectedMedicines, medicineId]);
    }
  };

  const calculateTotal = () => {
    if (!prescription) return 0;
    return prescription.medicines
      .filter((m) => selectedMedicines.includes(m.id))
      .reduce((sum, m) => sum + m.unitPrice, 0);
  };

  const handleDispense = async () => {
    if (!prescription || selectedMedicines.length === 0) return;

    setDispensing(true);
    try {
      await api.post(`/pharmacy/prescriptions/${prescriptionId}/dispense`, {
        medicineIds: selectedMedicines,
        paymentMethod,
      });
      navigate('/pharmacy/prescriptions');
    } catch (error) {
      console.error('Error dispensing medicines:', error);
      alert('Failed to dispense medicines');
    } finally {
      setDispensing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 font-medium">{prescription.patientName}</p>
            <p className="text-sm text-gray-500">
              Patient ID: {prescription.patientId} • Dr. {prescription.doctorName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Prescription Date</p>
            <p className="font-medium">{new Date(prescription.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-3 p-2 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">Diagnosis: </span>
          <span className="text-sm font-medium">{prescription.diagnosis}</span>
        </div>
      </div>

      {/* Medicines List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Medicines to Dispense</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {prescription.medicines.map((medicine) => (
            <div
              key={medicine.id}
              className={`p-4 ${medicine.dispensed ? 'bg-green-50' : !medicine.available ? 'bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {!medicine.dispensed && medicine.available && (
                    <input
                      type="checkbox"
                      checked={selectedMedicines.includes(medicine.id)}
                      onChange={() => toggleMedicine(medicine.id)}
                      className="mt-1 rounded border-gray-300"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{medicine.name}</div>
                    <div className="text-sm text-gray-600">
                      {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                    </div>
                    {medicine.instructions && (
                      <div className="text-sm text-gray-500 mt-1">
                        Instructions: {medicine.instructions}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">₹{medicine.unitPrice.toFixed(2)}</div>
                  {medicine.dispensed ? (
                    <span className="text-xs text-green-600 font-medium">Dispensed</span>
                  ) : !medicine.available ? (
                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Selected Medicines</span>
            <span className="font-medium">{selectedMedicines.length}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="flex space-x-4">
            {['CASH', 'CARD', 'UPI'].map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                {method}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDispense}
          disabled={dispensing || selectedMedicines.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {dispensing ? 'Processing...' : 'Dispense & Generate Bill'}
        </button>
      </div>
    </div>
  );
}
