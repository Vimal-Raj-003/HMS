import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  Calendar,
  FileText,
  Activity,
  Plus,
  Trash2,
  Stethoscope,
  ClipboardList,
  Save,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { doctorAPI } from '../../lib/api';
import api from '../../lib/api';

interface NurseRecordedVitals {
  id: string;
  temperature: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  notes: string | null;
  recordedAt: string;
  recordedBy: {
    id: string;
    name: string;
  } | null;
}

interface QueuePatient {
  id: string;
  queueNumber: number;
  patientId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  waitTime: string;
  chiefComplaint: string;
  appointmentId: string;
  appointmentTime: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string | null;
    allergies: string[];
    medicalHistory: string[];
    weight: number | null;
  };
  // Nurse-recorded vitals from backend
  vitals: NurseRecordedVitals | null;
}

interface Vitals {
  bloodPressure: string;
  temperature: string;
  pulse: string;
  weight: string;
  spo2: string;
  respiratoryRate: string;
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabTest {
  id: string;
  name: string;
}

interface ConsultationForm {
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  clinicalObservations: string;
  doctorNotes: string;
  labTestsRecommended: string[];
  followUpDate: string;
  additionalRemarks: string;
}

interface ConsultationStats {
  totalPatients: number;
  completed: number;
  remaining: number;
}

// Helper function to get local date string in IST format
const getLocalDateString = () => {
  const now = new Date();
  // Adjust for IST timezone (UTC+5:30)
  const istOffset = 5.5 * 60; // IST offset in minutes
  const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60 * 1000);
  return istTime.toISOString().split('T')[0];
};

export default function ConsultationWorkspace() {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableLabTests, setAvailableLabTests] = useState<LabTest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [stats, setStats] = useState<ConsultationStats>({ totalPatients: 0, completed: 0, remaining: 0 });

  // Form states
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    spo2: '',
    respiratoryRate: '',
  });
  const [consultation, setConsultation] = useState<ConsultationForm>({
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    clinicalObservations: '',
    doctorNotes: '',
    labTestsRecommended: [],
    followUpDate: '',
    additionalRemarks: '',
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    fetchQueue();
    fetchLabTests();
  }, [selectedDate]);

  const fetchQueue = async () => {
    try {
      console.log('[Consultation] Fetching queue for date:', selectedDate);
      const response = await doctorAPI.getQueue(selectedDate);
      console.log('[Consultation] Queue response:', response.data);
      const queueData = response.data.queue || [];
      setQueue(queueData);
      
      // Calculate stats from queue data
      const total = queueData.length;
      const completed = queueData.filter((p: QueuePatient) => p.status === 'COMPLETED').length;
      const remaining = queueData.filter((p: QueuePatient) =>
        p.status === 'WAITING' || p.status === 'IN_PROGRESS'
      ).length;
      
      console.log('[Consultation] Stats calculated:', { total, completed, remaining });
      
      setStats({
        totalPatients: total,
        completed,
        remaining,
      });
    } catch (error) {
      console.error('[Consultation] Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTests = async () => {
    try {
      const response = await api.get('/lab/tests/catalog');
      setAvailableLabTests(response.data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const selectPatient = async (patient: QueuePatient) => {
    // If there's a patient currently in progress, mark them as completed first
    if (selectedPatient && selectedPatient.status === 'IN_PROGRESS') {
      // Don't switch if clicking the same patient
      if (selectedPatient.id === patient.id) return;
    }

    setSelectedPatient(patient);
    
    // Mark as in progress
    if (patient.status === 'WAITING') {
      try {
        await api.put(`/doctors/appointments/${patient.appointmentId}/start`);
        setQueue(queue.map(p =>
          p.id === patient.id ? { ...p, status: 'IN_PROGRESS' as const } : p
        ));
      } catch (error) {
        console.error('Error starting consultation:', error);
      }
    }

    // Reset form with nurse-recorded vitals if available
    const nurseVitals = patient.vitals;
    setVitals({
      bloodPressure: nurseVitals?.bloodPressureSystolic && nurseVitals?.bloodPressureDiastolic
        ? `${nurseVitals.bloodPressureSystolic}/${nurseVitals.bloodPressureDiastolic}`
        : '',
      temperature: nurseVitals?.temperature?.toString() || '',
      pulse: nurseVitals?.heartRate?.toString() || '',
      weight: nurseVitals?.weight?.toString() || patient.patient.weight?.toString() || '',
      spo2: nurseVitals?.oxygenSaturation?.toString() || '',
      respiratoryRate: nurseVitals?.respiratoryRate?.toString() || '',
    });
    setConsultation({
      chiefComplaint: patient.chiefComplaint || '',
      symptoms: '',
      diagnosis: '',
      clinicalObservations: '',
      doctorNotes: '',
      labTestsRecommended: [],
      followUpDate: '',
      additionalRemarks: '',
    });
    setMedicines([]);
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSubmit = async (action: 'save' | 'complete') => {
    if (!selectedPatient) return;
    
    setSaving(true);
    try {
      await api.post('/doctor/consultation', {
        patientId: selectedPatient.patientId,
        appointmentId: selectedPatient.appointmentId,
        vitals,
        ...consultation,
        medicines,
        status: action === 'complete' ? 'COMPLETED' : 'DRAFT',
      });
      
      if (action === 'complete') {
        // Update queue status
        setQueue(queue.map(p => 
          p.id === selectedPatient.id ? { ...p, status: 'COMPLETED' as const } : p
        ));
        
        // Select next waiting patient
        const nextPatient = queue.find(p => p.status === 'WAITING');
        if (nextPatient) {
          selectPatient(nextPatient);
        } else {
          setSelectedPatient(null);
        }
      } else {
        alert('Consultation saved as draft');
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Failed to save consultation');
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

  const getPatientCardStyle = (patient: QueuePatient) => {
    if (patient.status === 'COMPLETED') {
      return 'bg-green-50 border-green-200 hover:border-green-300';
    }
    if (patient.status === 'IN_PROGRESS') {
      return 'bg-blue-50 border-blue-300 ring-2 ring-blue-500';
    }
    return 'bg-white border-secondary-200 hover:border-primary-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-secondary-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-end mb-4 gap-4">
        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-secondary-400" />
            <span className="text-secondary-600">Waiting</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-4 h-4 text-blue-600" />
            <span className="text-secondary-600">In Progress</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-secondary-600">Completed</span>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Total Patients Today</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.totalPatients}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Completed Today</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-secondary-500">Remaining Today</p>
            <p className="text-2xl font-bold text-secondary-900">{stats.remaining}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Patient Queue */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-secondary-200 shadow-card flex flex-col">
          <div className="px-4 py-3 border-b border-secondary-200 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-secondary-900">Patient Queue</h2>
            <span className="ml-auto text-sm text-secondary-500">
              {queue.filter(p => p.status !== 'COMPLETED').length} waiting
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-secondary-300 mb-3" />
                <p className="text-sm text-secondary-500">No patients in queue</p>
              </div>
            ) : (
              queue.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  disabled={patient.status === 'COMPLETED'}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${getPatientCardStyle(patient)} ${
                    selectedPatient?.id === patient.id ? 'ring-2 ring-primary-500' : ''
                  } ${patient.status === 'COMPLETED' ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(patient.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-secondary-900 truncate">
                          {patient.patient.firstName} {patient.patient.lastName}
                        </span>
                        <span className="text-xs font-bold text-primary-600">
                          #{patient.queueNumber}
                        </span>
                      </div>
                      <div className="text-xs text-secondary-500 mt-0.5">
                        {calculateAge(patient.patient.dateOfBirth)} yrs, {patient.patient.gender}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-secondary-500">
                        <Clock className="w-3 h-3" />
                        <span>{patient.appointmentTime}</span>
                        <span className="text-secondary-300">•</span>
                        <span>{patient.waitTime || '0 min'} wait</span>
                      </div>
                      {patient.chiefComplaint && (
                        <p className="text-xs text-secondary-600 mt-1.5 line-clamp-1">
                          {patient.chiefComplaint}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Consultation Form */}
        <div className="flex-1 bg-white rounded-xl border border-secondary-200 shadow-card flex flex-col min-w-0">
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="px-5 py-4 border-b border-secondary-200 bg-gradient-to-r from-primary-50 to-healthcare-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-700">
                        {selectedPatient.patient.firstName[0]}
                        {selectedPatient.patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">
                        {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-secondary-600">
                        <span>PID: {selectedPatient.patientId.slice(-8)}</span>
                        <span>•</span>
                        <span>{calculateAge(selectedPatient.patient.dateOfBirth)} yrs, {selectedPatient.patient.gender}</span>
                        <span>•</span>
                        <span>{selectedPatient.appointmentTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedPatient.patient.bloodGroup && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {selectedPatient.patient.bloodGroup}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPatient.status === 'IN_PROGRESS' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedPatient.status === 'IN_PROGRESS' ? 'In Progress' : 'Waiting'}
                    </span>
                  </div>
                </div>
                {selectedPatient.patient.allergies && selectedPatient.patient.allergies.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-medium">Allergies:</span>
                    <span className="text-red-600">{selectedPatient.patient.allergies.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Patient Information */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Patient Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary-500">Patient Name</span>
                          <p className="font-medium text-secondary-900">
                            {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-secondary-500">Patient ID</span>
                          <p className="font-medium text-secondary-900">{selectedPatient.patientId.slice(-8)}</p>
                        </div>
                        <div>
                          <span className="text-secondary-500">Age</span>
                          <p className="font-medium text-secondary-900">{calculateAge(selectedPatient.patient.dateOfBirth)} years</p>
                        </div>
                        <div>
                          <span className="text-secondary-500">Gender</span>
                          <p className="font-medium text-secondary-900">{selectedPatient.patient.gender}</p>
                        </div>
                        <div>
                          <span className="text-secondary-500">Visit Date</span>
                          <p className="font-medium text-secondary-900">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-secondary-500">Phone</span>
                          <p className="font-medium text-secondary-900">{selectedPatient.patient.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Section */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Vitals
                        </h4>
                        {selectedPatient.vitals && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Recorded by {selectedPatient.vitals.recordedBy?.name || 'Nurse'}
                          </span>
                        )}
                      </div>
                      {selectedPatient.vitals && (
                        <div className="text-xs text-secondary-500 mb-3">
                          Recorded at: {new Date(selectedPatient.vitals.recordedAt).toLocaleString()}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Blood Pressure</label>
                          <input
                            type="text"
                            value={vitals.bloodPressure}
                            onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                            placeholder="120/80 mmHg"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Heart Rate</label>
                          <input
                            type="text"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            placeholder="72 bpm"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Temperature</label>
                          <input
                            type="text"
                            value={vitals.temperature}
                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            placeholder="98.6°F"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Weight</label>
                          <input
                            type="text"
                            value={vitals.weight}
                            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                            placeholder="70 kg"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Oxygen Saturation</label>
                          <input
                            type="text"
                            value={vitals.spo2}
                            onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                            placeholder="98%"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Respiratory Rate</label>
                          <input
                            type="text"
                            value={vitals.respiratoryRate}
                            onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                            placeholder="16 /min"
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      {selectedPatient.vitals?.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            <strong>Nurse Notes:</strong> {selectedPatient.vitals.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Clinical Notes Section */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Clinical Notes
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Chief Complaint</label>
                          <textarea
                            value={consultation.chiefComplaint}
                            onChange={(e) => setConsultation({ ...consultation, chiefComplaint: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Patient's main complaint..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Symptoms</label>
                          <textarea
                            value={consultation.symptoms}
                            onChange={(e) => setConsultation({ ...consultation, symptoms: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Associated symptoms..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Diagnosis</label>
                          <input
                            type="text"
                            value={consultation.diagnosis}
                            onChange={(e) => setConsultation({ ...consultation, diagnosis: e.target.value })}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Working diagnosis..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Clinical Observations</label>
                          <textarea
                            value={consultation.clinicalObservations}
                            onChange={(e) => setConsultation({ ...consultation, clinicalObservations: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Physical examination findings..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Doctor Notes</label>
                          <textarea
                            value={consultation.doctorNotes}
                            onChange={(e) => setConsultation({ ...consultation, doctorNotes: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Additional clinical notes..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Prescription Section */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-secondary-700 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Prescription
                        </h4>
                        <button
                          onClick={addMedicine}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Medicine
                        </button>
                      </div>
                      
                      {medicines.length === 0 ? (
                        <div className="text-center py-6 text-secondary-500 text-sm">
                          No medicines added. Click "Add Medicine" to start.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {medicines.map((medicine, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-secondary-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-secondary-700">Medicine {index + 1}</span>
                                <button
                                  onClick={() => removeMedicine(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-secondary-500 mb-0.5">Medicine Name</label>
                                  <input
                                    type="text"
                                    value={medicine.name}
                                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-1.5 text-sm"
                                    placeholder="Medicine name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-secondary-500 mb-0.5">Dosage</label>
                                  <input
                                    type="text"
                                    value={medicine.dosage}
                                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-1.5 text-sm"
                                    placeholder="e.g., 500mg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-secondary-500 mb-0.5">Frequency</label>
                                  <select
                                    value={medicine.frequency}
                                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-1.5 text-sm"
                                  >
                                    <option value="">Select</option>
                                    <option value="OD">Once daily (OD)</option>
                                    <option value="BD">Twice daily (BD)</option>
                                    <option value="TDS">Three times (TDS)</option>
                                    <option value="QDS">Four times (QDS)</option>
                                    <option value="PRN">As needed (PRN)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-secondary-500 mb-0.5">Duration</label>
                                  <input
                                    type="text"
                                    value={medicine.duration}
                                    onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-1.5 text-sm"
                                    placeholder="e.g., 5 days"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs text-secondary-500 mb-0.5">Instructions</label>
                                  <input
                                    type="text"
                                    value={medicine.instructions}
                                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-1.5 text-sm"
                                    placeholder="e.g., After food"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lab Tests Section */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Lab Tests Recommended
                      </h4>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availableLabTests.map((test) => (
                          <label key={test.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={consultation.labTestsRecommended.includes(test.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConsultation({
                                    ...consultation,
                                    labTestsRecommended: [...consultation.labTestsRecommended, test.id]
                                  });
                                } else {
                                  setConsultation({
                                    ...consultation,
                                    labTestsRecommended: consultation.labTestsRecommended.filter(id => id !== test.id)
                                  });
                                }
                              }}
                              className="rounded border-secondary-300"
                            />
                            <span className="text-secondary-700">{test.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Follow-up & Additional */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Follow-up & Additional
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Follow-up Date</label>
                          <input
                            type="date"
                            value={consultation.followUpDate}
                            onChange={(e) => setConsultation({ ...consultation, followUpDate: e.target.value })}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">Additional Remarks</label>
                          <textarea
                            value={consultation.additionalRemarks}
                            onChange={(e) => setConsultation({ ...consultation, additionalRemarks: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Any additional remarks..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical History */}
                    {selectedPatient.patient.medicalHistory && selectedPatient.patient.medicalHistory.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Medical History</h4>
                        <ul className="space-y-1">
                          {selectedPatient.patient.medicalHistory.map((item, index) => (
                            <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-4 border-t border-secondary-200 bg-secondary-50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSubmit('save')}
                    disabled={saving}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSubmit('complete')}
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Complete & Next Patient
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
                <Stethoscope className="w-10 h-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Patient Selected</h3>
              <p className="text-sm text-secondary-500 max-w-sm">
                Select a patient from the queue on the left to begin the consultation. 
                The patient's details and consultation form will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
