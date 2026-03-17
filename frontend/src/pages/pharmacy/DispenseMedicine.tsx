import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Loader2,
  IndianRupee,
  ShoppingCart,
  CreditCard,
  ArrowLeft,
  Package
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
  dispensedQuantity: number | null;
  available: boolean;
  availableQuantity: number;
  unitPrice: number;
  suggestedBatch: {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
  } | null;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  createdAt: string;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string | null;
  };
  doctor: {
    firstName: string;
    lastName: string;
    specialty: string | null;
  };
  consultation?: {
    provisionalDiagnosis: string | null;
    finalDiagnosis: string | null;
    advice: string | null;
  };
  items: MedicineItem[];
}

interface DispenseItem {
  prescriptionItemId: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  medicineName: string;
  available: boolean;
}

export default function DispenseMedicine() {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [selectedItems, setSelectedItems] = useState<DispenseItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'netbanking'>('cash');
  const [discount, setDiscount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      const response = await pharmacyAPI.getPrescription(prescriptionId!);
      // The axios interceptor unwraps response.data from { success, data: {...} } to just the inner data
      const data = response.data as any;
      setPrescription(data);
      
      // Pre-select all available and not yet dispensed medicines
      const availableItems = (data.items || [])
        .filter((item: MedicineItem) => item.available && !item.isDispensed)
        .map((item: MedicineItem) => ({
          prescriptionItemId: item.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          medicineName: item.medicine.name,
          available: item.available,
        }));
      setSelectedItems(availableItems);
    } catch (error) {
      console.error('Error fetching prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: MedicineItem) => {
    if (item.isDispensed || !item.available) return;

    const existingIndex = selectedItems.findIndex(
      (si) => si.prescriptionItemId === item.id
    );

    if (existingIndex >= 0) {
      setSelectedItems(selectedItems.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          prescriptionItemId: item.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          medicineName: item.medicine.name,
          available: item.available,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((si) =>
        si.prescriptionItemId === itemId ? { ...si, quantity } : si
      )
    );
  };

  const getSelectedItem = (itemId: string) => {
    return selectedItems.find((si) => si.prescriptionItemId === itemId);
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05; // 5% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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

  const handleDispense = async () => {
    if (!prescription || selectedItems.length === 0) return;

    setDispensing(true);
    try {
      const response = await pharmacyAPI.dispense({
        prescriptionId: prescription.id,
        patientId: prescription.patient.id,
        items: selectedItems.map((item) => ({
          medicineId: item.medicineId,
          prescriptionItemId: item.prescriptionItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        discount,
      });

      const data = response.data as any;
      setBillData(data);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error dispensing medicines:', error);
      alert(error.response?.data?.message || 'Failed to dispense medicines');
    } finally {
      setDispensing(false);
    }
  };

  // Success Screen
  if (showSuccess && billData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-green-200 shadow-card overflow-hidden">
          <div className="p-6 bg-green-50 border-b border-green-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-800">Dispensing Complete!</h2>
            <p className="text-green-600 mt-1">Medicines have been dispensed successfully</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-xs text-secondary-500">Dispense Number</p>
                <p className="font-semibold text-secondary-900">{billData.dispenseNumber}</p>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-xs text-secondary-500">Bill Number</p>
                <p className="font-semibold text-secondary-900">{billData.billNumber}</p>
              </div>
            </div>
            
            <div className="border-t border-secondary-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(billData.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Tax (5% GST)</span>
                <span className="font-medium">{formatCurrency(billData.tax || 0)}</span>
              </div>
              {billData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(billData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-secondary-200">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(billData.finalAmount || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-secondary-50 flex gap-3">
            <button
              onClick={() => navigate('/pharmacy/bills')}
              className="flex-1 btn-secondary"
            >
              View Bills
            </button>
            <button
              onClick={() => navigate('/pharmacy/prescriptions')}
              className="flex-1 btn-primary"
            >
              Next Prescription
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Prescription not found</p>
        <button onClick={() => navigate('/pharmacy/prescriptions')} className="btn-primary mt-4">
          Back to Prescriptions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/pharmacy/prescriptions')}
        className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Prescriptions
      </button>

      {/* Patient Info */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-100">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">
                {prescription.patient.firstName} {prescription.patient.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-600 mt-1">
                <span>{prescription.patient.patientNumber}</span>
                <span>{calculateAge(prescription.patient.dateOfBirth)} yrs</span>
                <span>{prescription.patient.gender}</span>
                <span>{prescription.patient.phone}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary-500">Prescription</p>
            <p className="font-medium text-secondary-900">{prescription.prescriptionNumber}</p>
            <p className="text-xs text-secondary-500 mt-1">
              {new Date(prescription.createdAt).toLocaleDateString('en-IN', { 
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-secondary-200 flex items-start gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4 text-secondary-400" />
            <span className="text-secondary-600">Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}</span>
            {prescription.doctor.specialty && (
              <span className="text-secondary-400">({prescription.doctor.specialty})</span>
            )}
          </div>
        </div>
        
        {prescription.consultation?.provisionalDiagnosis && (
          <div className="mt-3 p-3 bg-secondary-50 rounded-lg">
            <span className="text-sm text-secondary-600">Diagnosis: </span>
            <span className="text-sm font-medium text-secondary-900">
              {prescription.consultation.provisionalDiagnosis}
            </span>
          </div>
        )}
      </div>

      {/* Medicines List */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-secondary-200">
          <h3 className="font-semibold text-secondary-900">Select Medicines to Dispense</h3>
          <p className="text-sm text-secondary-500">
            {selectedItems.length} of {prescription.items.filter(i => !i.isDispensed).length} items selected
          </p>
        </div>
        
        <div className="divide-y divide-secondary-200">
          {prescription.items.map((item) => {
            const isSelected = getSelectedItem(item.id);
            const selectedItem = isSelected;
            
            return (
              <div
                key={item.id}
                className={`p-4 ${
                  item.isDispensed 
                    ? 'bg-green-50' 
                    : !item.available 
                      ? 'bg-red-50 opacity-75' 
                      : isSelected 
                        ? 'bg-primary-50' 
                        : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {!item.isDispensed && item.available && (
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleItem(item)}
                      className="mt-1 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-secondary-900">{item.medicine.name}</span>
                      {item.isDispensed ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Dispensed
                        </span>
                      ) : !item.available ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      ) : null}
                    </div>
                    
                    <p className="text-sm text-secondary-600 mt-1">
                      {item.dosage} • {item.frequency} • {item.durationDays} days
                    </p>
                    
                    {item.instructions && (
                      <p className="text-xs text-secondary-500 mt-1">
                        Instructions: {item.instructions}
                      </p>
                    )}
                    
                    {item.suggestedBatch && (
                      <p className="text-xs text-secondary-500 mt-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Batch: {item.suggestedBatch.batchNumber} • 
                        Expires: {new Date(item.suggestedBatch.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-secondary-900">
                      {formatCurrency(item.unitPrice)}/unit
                    </p>
                    {isSelected && !item.isDispensed && selectedItem && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          value={selectedItem.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-sm rounded border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-xs text-secondary-500">
                          = {formatCurrency(item.unitPrice * selectedItem.quantity)}
                        </span>
                      </div>
                    )}
                    {!isSelected && !item.isDispensed && (
                      <p className="text-sm text-secondary-500 mt-1">
                        Total: {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <h3 className="font-semibold text-secondary-900 mb-4">Bill Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-secondary-600">Selected Medicines ({selectedItems.length})</span>
            <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-secondary-600">Tax (5% GST)</span>
            <span className="font-medium">{formatCurrency(calculateTax())}</span>
          </div>
          
          <div className="flex items-center gap-3 pt-2 border-t border-secondary-200">
            <label className="text-sm text-secondary-600">Discount</label>
            <div className="flex-1 relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between text-lg font-bold pt-3 border-t border-secondary-200">
            <span>Total Amount</span>
            <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <label className="block text-sm font-medium text-secondary-700 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'cash', label: 'Cash', icon: IndianRupee },
              { value: 'upi', label: 'UPI', icon: CreditCard },
              { value: 'card', label: 'Card', icon: CreditCard },
              { value: 'netbanking', label: 'Net Banking', icon: CreditCard },
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value as any)}
                className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                  paymentMethod === method.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 hover:border-secondary-300'
                }`}
              >
                <method.icon className="w-5 h-5" />
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="px-6 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDispense}
          disabled={dispensing || selectedItems.length === 0}
          className="btn-primary inline-flex items-center gap-2"
        >
          {dispensing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          {dispensing ? 'Processing...' : 'Dispense & Generate Bill'}
        </button>
      </div>
    </div>
  );
}
