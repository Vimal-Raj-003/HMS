import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  User,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Scale,
  Ruler,
  Droplets,
  FileText,
  Save,
  X,
  ChevronRight,
  Stethoscope,
  Calendar,
  Clock,
  Phone,
  AlertCircle,
} from 'lucide-react';
import api from '../../lib/api';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  bloodGroup: string;
  patientNumber: string;
  gender: string;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
}

interface VitalsForm {
  temperature: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  notes: string;
}

interface PreviousVitals {
  temperature: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  recordedAt: string;
}

export default function RecordVitals() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentIdFromQuery = searchParams.get('appointmentId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Patient search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'name' | 'id' | 'doctorName' | 'doctorId'>('phone');
  const [searchResults, setSearchResults] = useState<Array<Patient & { appointment?: Appointment }>>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected patient and appointment
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  // Form state
  const [formData, setFormData] = useState<VitalsForm>({
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    notes: '',
  });
  const [previousVitals, setPreviousVitals] = useState<PreviousVitals | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  // If patientId is provided in URL, load patient data directly
  useEffect(() => {
    if (patientId) {
      loadPatientData(patientId);
    }
  }, [patientId]);

  const loadPatientData = async (id: string) => {
    setLoading(true);
    try {
      const [patientRes, appointmentsRes, vitalsRes] = await Promise.all([
        api.get(`/nurse/patient/${id}`),
        api.get(`/nurse/patient/${id}/appointments`),
        api.get(`/nurse/patient/${id}/vitals/latest`),
      ]);

      setSelectedPatient(patientRes.data);
      setPatientAppointments(appointmentsRes.data || []);

      // If appointmentId is provided in query, select it
      if (appointmentIdFromQuery) {
        const apt = appointmentsRes.data?.find((a: Appointment) => a.id === appointmentIdFromQuery);
        if (apt) {
          setSelectedAppointment(apt);
        }
      } else if (appointmentsRes.data?.length > 0) {
        // Select the first pending appointment for today
        const today = new Date().toISOString().split('T')[0];
        const todayApt = appointmentsRes.data.find((a: Appointment) => 
          a.appointmentDate === today && a.status !== 'COMPLETED'
        );
        if (todayApt) {
          setSelectedAppointment(todayApt);
        }
      }

      if (vitalsRes.data) {
        setPreviousVitals(vitalsRes.data);
        // Pre-fill weight and height from previous vitals
        if (vitalsRes.data.weight) {
          setFormData(prev => ({ ...prev, weight: vitalsRes.data.weight.toString() }));
        }
        if (vitalsRes.data.height) {
          setFormData(prev => ({ ...prev, height: vitalsRes.data.height.toString() }));
        }
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const params: Record<string, string> = {
        type: searchType,
        query: searchTerm,
      };
      const response = await api.get('/nurse/patients/search', { params });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient: Patient & { appointment?: Appointment }) => {
    setSelectedPatient(patient);
    if (patient.appointment) {
      setSelectedAppointment(patient.appointment);
    }
    navigate(`/nurse/vitals/${patient.id}`, { replace: true });
  };

  const handleBackToSearch = () => {
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setPatientAppointments([]);
    setPreviousVitals(null);
    setFormData({
      temperature: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      notes: '',
    });
    setAlerts([]);
    navigate('/nurse/vitals');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear alerts when values change
    setAlerts([]);
  };

  const validateForm = (): boolean => {
    const newAlerts: string[] = [];
    
    // Validate blood pressure
    const systolic = parseInt(formData.bloodPressureSystolic);
    const diastolic = parseInt(formData.bloodPressureDiastolic);
    if (systolic && diastolic) {
      if (systolic > 140 || diastolic > 90) {
        newAlerts.push('High blood pressure detected');
      }
      if (systolic < 90 || diastolic < 60) {
        newAlerts.push('Low blood pressure detected');
      }
    }

    // Validate heart rate
    const heartRate = parseInt(formData.heartRate);
    if (heartRate) {
      if (heartRate > 100) {
        newAlerts.push('Elevated heart rate');
      }
      if (heartRate < 60) {
        newAlerts.push('Low heart rate');
      }
    }

    // Validate temperature
    const temp = parseFloat(formData.temperature);
    if (temp) {
      if (temp > 99.5) {
        newAlerts.push('Fever detected');
      }
      if (temp < 97.0) {
        newAlerts.push('Low temperature');
      }
    }

    // Validate oxygen saturation
    const spo2 = parseInt(formData.oxygenSaturation);
    if (spo2 && spo2 < 95) {
      newAlerts.push('Low oxygen saturation');
    }

    setAlerts(newAlerts);
    return true; // Allow submission even with alerts
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    validateForm();

    setSaving(true);
    try {
      const payload = {
        patientId: selectedPatient.id,
        appointmentId: selectedAppointment?.id || null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        notes: formData.notes || null,
      };

      await api.post('/nurse/vitals', payload);
      
      // Navigate back to search or dashboard
      navigate('/nurse/dashboard');
    } catch (error) {
      console.error('Error saving vitals:', error);
      alert('Failed to save vitals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Loading state when patientId is provided
  if (patientId && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Patient selected - show vitals form
  if (selectedPatient) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToSearch}
            className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-500">
                  <span>ID: {selectedPatient.patientNumber}</span>
                  <span>•</span>
                  <span>Age: {calculateAge(selectedPatient.dateOfBirth)} yrs</span>
                  <span>•</span>
                  <span>{selectedPatient.gender}</span>
                  {selectedPatient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {selectedPatient.bloodGroup}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-secondary-500 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedPatient.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Selection */}
        {patientAppointments.length > 0 && (
          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Appointment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patientAppointments.map((apt) => (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => setSelectedAppointment(apt)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedAppointment?.id === apt.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                      : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-secondary-900">
                      Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                    </span>
                  </div>
                  <div className="text-sm text-secondary-500">
                    {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                  </div>
                  <div className="text-xs text-secondary-400 mt-1">
                    {apt.doctor.specialty}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Appointment Info */}
        {selectedAppointment && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedAppointment.doctor.specialty} • Appointment ID: {selectedAppointment.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Vital Signs Alerts</p>
                <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                  {alerts.map((alert, index) => (
                    <li key={index}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Vitals Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Vital Signs
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      Temperature (°F)
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="98.6"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" />
                      Blood Pressure (mmHg)
                    </div>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="bloodPressureSystolic"
                      value={formData.bloodPressureSystolic}
                      onChange={handleChange}
                      placeholder="120"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                    <span className="text-secondary-400">/</span>
                    <input
                      type="number"
                      name="bloodPressureDiastolic"
                      value={formData.bloodPressureDiastolic}
                      onChange={handleChange}
                      placeholder="80"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Heart Rate (bpm)
                    </div>
                  </label>
                  <input
                    type="number"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    placeholder="72"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-cyan-500" />
                      Respiratory Rate (/min)
                    </div>
                  </label>
                  <input
                    type="number"
                    name="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={handleChange}
                    placeholder="16"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                {/* Oxygen Saturation */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      SpO2 (%)
                    </div>
                  </label>
                  <input
                    type="number"
                    name="oxygenSaturation"
                    value={formData.oxygenSaturation}
                    onChange={handleChange}
                    placeholder="98"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-purple-500" />
                      Weight (kg)
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-indigo-500" />
                      Height (cm)
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="170"
                    className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-secondary-500" />
                    Notes (Optional)
                  </div>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional observations or notes..."
                  className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="px-4 py-2.5 rounded-lg border border-secondary-300 text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Vitals
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Previous Vitals Sidebar */}
          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Previous Vitals
            </h3>
            {previousVitals ? (
              <div className="space-y-3">
                <div className="text-xs text-secondary-500 mb-3">
                  Recorded: {new Date(previousVitals.recordedAt).toLocaleString()}
                </div>
                
                {[
                  { label: 'Temperature', value: previousVitals.temperature, unit: '°F' },
                  { label: 'BP', value: previousVitals.bloodPressureSystolic && previousVitals.bloodPressureDiastolic ? `${previousVitals.bloodPressureSystolic}/${previousVitals.bloodPressureDiastolic}` : null, unit: 'mmHg' },
                  { label: 'Heart Rate', value: previousVitals.heartRate, unit: 'bpm' },
                  { label: 'Resp. Rate', value: previousVitals.respiratoryRate, unit: '/min' },
                  { label: 'SpO2', value: previousVitals.oxygenSaturation, unit: '%' },
                  { label: 'Weight', value: previousVitals.weight, unit: 'kg' },
                  { label: 'Height', value: previousVitals.height, unit: 'cm' },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-secondary-100 last:border-0">
                    <span className="text-sm text-secondary-600">{item.label}</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {item.value ? `${item.value} ${item.unit}` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm text-secondary-500">No previous vitals recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No patient selected - show search interface
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Type Selection */}
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'phone', label: 'Phone' },
              { value: 'name', label: 'Name' },
              { value: 'id', label: 'Patient ID' },
              { value: 'doctorName', label: 'Doctor Name' },
              { value: 'doctorId', label: 'Doctor ID' },
            ].map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  searchType === type.value
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-secondary-50 text-secondary-600 border-2 border-transparent hover:bg-secondary-100'
                }`}
              >
                <input
                  type="radio"
                  name="searchType"
                  value={type.value}
                  checked={searchType === type.value}
                  onChange={() => setSearchType(type.value as typeof searchType)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{type.label}</span>
              </label>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchType === 'phone' ? 'Enter phone number...' :
                  searchType === 'name' ? 'Enter patient name...' :
                  searchType === 'id' ? 'Enter patient ID...' :
                  searchType === 'doctorName' ? 'Enter doctor name...' :
                  'Enter doctor ID...'
                }
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <div className="p-4 border-b border-secondary-100">
            <h3 className="font-semibold text-secondary-900">Search Results</h3>
            <p className="text-sm text-secondary-500">
              {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {searching ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-secondary-600 font-medium">No patients found</p>
              <p className="text-sm text-secondary-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-lg">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-secondary-500">
                        ID: {patient.patientNumber} • {patient.phone}
                      </p>
                      {patient.appointment && (
                        <p className="text-xs text-primary-600 mt-1">
                          Appointment with Dr. {patient.appointment.doctor.firstName} {patient.appointment.doctor.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-secondary-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
