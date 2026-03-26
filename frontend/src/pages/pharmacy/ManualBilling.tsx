import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  IndianRupee,
  CreditCard,
  CheckCircle,
  Loader2,
  Package,
  AlertCircle,
  Printer,
  Stethoscope,
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';
import { printBill } from '../../lib/printBill';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  price: number;
  totalStock: number;
  nearestExpiry: string | null;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
}

interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string | null;
  category: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

export default function ManualBilling() {
  const navigate = useNavigate();

  // Patient search
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

  // Doctor search
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorResults, setDoctorResults] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchingDoctor, setSearchingDoctor] = useState(false);

  // Medicine search
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([]);
  const [searchingMedicine, setSearchingMedicine] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'netbanking'>('cash');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  // Patient search with debounce
  useEffect(() => {
    if (patientQuery.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    const timer = setTimeout(() => searchPatients(patientQuery), 300);
    return () => clearTimeout(timer);
  }, [patientQuery]);

  // Doctor search with debounce
  useEffect(() => {
    if (doctorQuery.trim().length < 2) {
      setDoctorResults([]);
      return;
    }
    const timer = setTimeout(() => searchDoctors(doctorQuery), 300);
    return () => clearTimeout(timer);
  }, [doctorQuery]);

  // Medicine search with debounce
  useEffect(() => {
    if (medicineQuery.trim().length < 2) {
      setMedicineResults([]);
      return;
    }
    const timer = setTimeout(() => searchMedicines(medicineQuery), 300);
    return () => clearTimeout(timer);
  }, [medicineQuery]);

  const searchPatients = async (query: string) => {
    setSearchingPatient(true);
    try {
      const response = await pharmacyAPI.searchPatients(query);
      setPatientResults(Array.isArray(response.data) ? response.data : []);
    } catch {
      setPatientResults([]);
    } finally {
      setSearchingPatient(false);
    }
  };

  const searchDoctors = async (query: string) => {
    setSearchingDoctor(true);
    try {
      const response = await pharmacyAPI.searchDoctors(query);
      setDoctorResults(Array.isArray(response.data) ? response.data : []);
    } catch {
      setDoctorResults([]);
    } finally {
      setSearchingDoctor(false);
    }
  };

  const searchMedicines = async (query: string) => {
    setSearchingMedicine(true);
    try {
      const response = await pharmacyAPI.getMedicines({ search: query, limit: 10 });
      setMedicineResults(Array.isArray(response.data) ? response.data : []);
    } catch {
      setMedicineResults([]);
    } finally {
      setSearchingMedicine(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientQuery('');
    setPatientResults([]);
  };

  const addToCart = useCallback((medicine: Medicine) => {
    const existing = cart.find((item) => item.medicineId === medicine.id);
    if (existing) {
      if (existing.quantity < medicine.totalStock) {
        setCart(
          cart.map((item) =>
            item.medicineId === medicine.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          category: medicine.category,
          quantity: 1,
          unitPrice: medicine.price,
          availableStock: medicine.totalStock,
        },
      ]);
    }
    setMedicineQuery('');
    setMedicineResults([]);
  }, [cart]);

  const updateCartQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: Math.min(quantity, item.availableStock) }
          : item
      )
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax - discount;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const handleSubmit = async () => {
    if (!selectedPatient || cart.length === 0) return;
    setSubmitting(true);
    try {
      const response = await pharmacyAPI.dispense({
        patientId: selectedPatient.id,
        items: cart.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        discount,
        doctorId: selectedDoctor?.id || undefined,
        notes: selectedDoctor
          ? `Manual billing - Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
          : 'Manual billing - over the counter',
      });
      setBillData(response.data);
      setShowSuccess(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSubmitting(false);
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
            <h2 className="text-xl font-bold text-green-800">Bill Generated!</h2>
            <p className="text-green-600 mt-1">Manual billing completed successfully</p>
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
              {(billData.discount || 0) > 0 && (
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
            <button onClick={() => navigate('/pharmacy/bills')} className="flex-1 btn-secondary">
              View Bills
            </button>
            <button
              onClick={() => printBill(billData.billId)}
              className="flex-1 btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Bill
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                setBillData(null);
                setSelectedPatient(null);
                setSelectedDoctor(null);
                setCart([]);
                setDiscount(0);
              }}
              className="flex-1 btn-primary"
            >
              New Manual Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Manual Billing</h1>
        <p className="text-sm text-secondary-500 mt-1">Sell medicines over the counter without a prescription</p>
      </div>

      {/* Step 1: Patient Selection */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
        <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" />
          Step 1: Select Patient
        </h3>

        {selectedPatient ? (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div>
              <p className="font-medium text-secondary-900">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-sm text-secondary-500">
                {selectedPatient.patientNumber} &bull; {selectedPatient.phone} &bull; {selectedPatient.gender}
              </p>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
              placeholder="Search by name, patient ID, or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {searchingPatient && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 animate-spin" />
            )}

            {patientResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-dropdown max-h-60 overflow-auto">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    className="w-full text-left px-4 py-3 hover:bg-secondary-50 border-b border-secondary-100 last:border-0"
                  >
                    <p className="font-medium text-secondary-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {patient.patientNumber} &bull; {patient.phone}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doctor Selection (Optional) */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
        <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary-600" />
          Prescribing Doctor (Optional)
        </h3>

        {selectedDoctor ? (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary-900">
                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </p>
              {selectedDoctor.specialty && (
                <p className="text-sm text-secondary-600">{selectedDoctor.specialty}</p>
              )}
            </div>
            <button
              onClick={() => { setSelectedDoctor(null); setDoctorQuery(''); }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              value={doctorQuery}
              onChange={(e) => setDoctorQuery(e.target.value)}
              placeholder="Search doctor by name or specialty..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {searchingDoctor && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 animate-spin" />
            )}
            {doctorResults.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white border border-secondary-200 rounded-lg shadow-dropdown max-h-60 overflow-auto">
                {doctorResults.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setDoctorQuery('');
                      setDoctorResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-secondary-50 border-b border-secondary-100 last:border-0"
                  >
                    <p className="font-medium text-secondary-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                    {doctor.specialty && (
                      <p className="text-xs text-secondary-500">{doctor.specialty}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Add Medicines */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
        <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-600" />
          Step 2: Add Medicines
        </h3>

        {/* Medicine Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            value={medicineQuery}
            onChange={(e) => setMedicineQuery(e.target.value)}
            placeholder="Search medicines by name or generic name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          {searchingMedicine && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 animate-spin" />
          )}

          {medicineResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-dropdown max-h-60 overflow-auto">
              {medicineResults.map((med) => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  disabled={med.totalStock <= 0}
                  className={`w-full text-left px-4 py-3 border-b border-secondary-100 last:border-0 flex items-center justify-between ${
                    med.totalStock <= 0
                      ? 'opacity-50 cursor-not-allowed bg-red-50'
                      : 'hover:bg-secondary-50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-secondary-900">{med.name}</p>
                    <p className="text-xs text-secondary-500">
                      {med.genericName || med.category} &bull; {formatCurrency(med.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    {med.totalStock > 0 ? (
                      <span className="text-xs text-green-600">Stock: {med.totalStock}</span>
                    ) : (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Out of stock
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        {cart.length === 0 ? (
          <div className="text-center py-8 text-secondary-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2" />
            <p>No medicines added yet</p>
            <p className="text-xs">Search and add medicines above</p>
          </div>
        ) : (
          <div className="border border-secondary-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary-50">
                  <th className="text-left px-4 py-2.5 font-medium text-secondary-600">Medicine</th>
                  <th className="text-center px-4 py-2.5 font-medium text-secondary-600">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-secondary-600">Price</th>
                  <th className="text-right px-4 py-2.5 font-medium text-secondary-600">Total</th>
                  <th className="px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {cart.map((item) => (
                  <tr key={item.medicineId}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-secondary-900">{item.medicineName}</p>
                      {item.genericName && (
                        <p className="text-xs text-secondary-500">{item.genericName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateCartQuantity(item.medicineId, item.quantity - 1)}
                          className="p-1 rounded hover:bg-secondary-100"
                        >
                          <Minus className="w-3.5 h-3.5 text-secondary-500" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartQuantity(item.medicineId, parseInt(e.target.value) || 1)
                          }
                          className="w-14 text-center px-1 py-1 rounded border border-secondary-200 text-sm"
                        />
                        <button
                          onClick={() => updateCartQuantity(item.medicineId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="p-1 rounded hover:bg-secondary-100 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5 text-secondary-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-secondary-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-secondary-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => removeFromCart(item.medicineId)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step 3: Payment */}
      {cart.length > 0 && selectedPatient && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-600" />
            Step 3: Payment
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-secondary-600">
                Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary-600">Tax (5% GST)</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-secondary-200">
              <label className="text-sm text-secondary-600 shrink-0">Discount</label>
              <div className="flex-1 relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
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
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-5 pt-4 border-t border-secondary-200">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Payment Method
            </label>
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

          {/* Submit */}
          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => {
                setCart([]);
                setSelectedPatient(null);
                setDiscount(0);
              }}
              className="px-5 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-50"
            >
              Clear All
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {submitting ? 'Processing...' : 'Generate Bill'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
