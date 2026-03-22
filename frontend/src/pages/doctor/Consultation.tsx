import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
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
  PanelLeftClose,
  PanelLeftOpen,
  Heart,
  Thermometer,
  Scale,
  Wind,
  Droplets,
  Ruler,
  FolderOpen,
  FlaskConical,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
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
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'WITH_DOCTOR';
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
  vitals: NurseRecordedVitals | null;
}

interface Vitals {
  bloodPressure: string;
  temperature: string;
  pulse: string;
  weight: string;
  spo2: string;
  respiratoryRate: string;
  height: string;
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

interface MedicalRecord {
  id: string;
  date: string;
  appointmentDate: string;
  appointmentType: string;
  doctorName: string;
  specialization: string;
  chiefComplaint: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  followUpDate: string | null;
}

interface LabReport {
  id: string;
  orderNumber: string;
  date: string;
  testName: string;
  tests: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
  }>;
  category: string;
  doctorName: string;
  status: string;
  results: Array<{
    id: string;
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    interpretation: string;
    status: string;
  }>;
  notes: string;
  isUrgent: boolean;
}

interface PatientDocument {
  id: string;
  documentName: string;
  documentType: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  notes: string | null;
  uploadDate: string;
  createdAt: string;
}

interface WarningCategory {
  label: string;
  icon: string;
  fields: string[];
}

// Helper function to get local date string in IST format
const getLocalDateString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const localOffset = now.getTimezoneOffset();
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
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'prescription' | 'records' | 'lab'>('vitals');
  const [feedbackMessage, setFeedbackMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Warning dialog state for flexible completion
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningCategories, setWarningCategories] = useState<WarningCategory[]>([]);
  const [showFieldWarnings, setShowFieldWarnings] = useState(false);

  // Medical Records and Lab Reports state
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingLabReports, setLoadingLabReports] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedLabReport, setSelectedLabReport] = useState<LabReport | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showLabReportModal, setShowLabReportModal] = useState(false);

  // Form states
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    spo2: '',
    respiratoryRate: '',
    height: '',
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

  // Fetch patient records when a patient is selected
  const fetchPatientRecords = useCallback(async (patientId: string) => {
    setLoadingRecords(true);
    try {
      const response = await doctorAPI.getPatientRecords(patientId);
      setMedicalRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching patient records:', error);
      setMedicalRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const fetchPatientLabReports = useCallback(async (patientId: string) => {
    setLoadingLabReports(true);
    try {
      const response = await doctorAPI.getPatientLabReports(patientId);
      setLabReports(response.data || []);
    } catch (error) {
      console.error('Error fetching patient lab reports:', error);
      setLabReports([]);
    } finally {
      setLoadingLabReports(false);
    }
  }, []);

  const fetchPatientDocuments = useCallback(async (patientId: string) => {
    setLoadingDocuments(true);
    try {
      const response = await doctorAPI.getPatientDocuments(patientId);
      setPatientDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      setPatientDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await doctorAPI.getQueue(selectedDate);
      const queueData = response.data.queue || [];
      setQueue(queueData);

      // Calculate stats from queue data
      const total = queueData.length;
      const completed = queueData.filter((p: QueuePatient) => p.status === 'COMPLETED').length;
      const remaining = total - completed;

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
  }, [selectedDate]);

  useEffect(() => {
    fetchQueue();
    fetchLabTests();
  }, [fetchQueue]);

  // Cleanup feedback message timeout on unmount
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const fetchLabTests = async () => {
    try {
      const response = await api.get('/lab/tests/catalog');
      setAvailableLabTests(response.data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const selectPatient = async (patient: QueuePatient) => {
    if (selectedPatient && selectedPatient.status === 'IN_PROGRESS') {
      if (selectedPatient.id === patient.id) return;
    }

    setSelectedPatient(patient);

    // Mark as in progress
    if (patient.status === 'WAITING') {
      try {
        await doctorAPI.startConsultation(patient.appointmentId);
        setQueue(queue.map(p =>
          p.id === patient.id ? { ...p, status: 'IN_PROGRESS' as const } : p
        ));
        // Update stats
        setStats(prev => ({
          ...prev,
          remaining: prev.remaining - 1,
        }));
      } catch (error) {
        console.error('Error starting consultation:', error);
        // Show error feedback and reset selection to prevent inconsistent state
        setFeedbackMessage({ message: 'Failed to start consultation. Please try again.', type: 'error' });
        setSelectedPatient(null);
        return;
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
      height: nurseVitals?.height?.toString() || '',
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
    setActiveTab('vitals');
    setShowFieldWarnings(false);
    setShowWarningDialog(false);

    // Fetch patient records and lab reports
    fetchPatientRecords(patient.patientId);
    fetchPatientLabReports(patient.patientId);
    fetchPatientDocuments(patient.patientId);
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

    // Validate truly required fields (system-level, not clinical)
    if (!selectedPatient.patientId) {
      setFeedbackMessage({ message: 'Patient ID is missing. Please select a patient.', type: 'error' });
      return;
    }
    if (!selectedPatient.appointmentId) {
      setFeedbackMessage({ message: 'Appointment ID is missing. Please select a patient.', type: 'error' });
      return;
    }

    if (action === 'save') {
      // Draft save — no warnings needed
      await submitConsultation('save');
      return;
    }

    // For completion: analyze completeness and show warning dialog if needed
    const warnings = analyzeCompleteness();
    if (warnings.length > 0) {
      setWarningCategories(warnings);
      setShowFieldWarnings(true);
      setShowWarningDialog(true);
    } else {
      // All fields filled — simple confirmation
      const confirmed = window.confirm(
        'Are you sure you want to complete this consultation? This action cannot be undone.'
      );
      if (!confirmed) return;
      await submitConsultation('complete');
    }
  };

  const handleNextPatient = async () => {
    const nextPatient = queue.find(p => p.status === 'WAITING');
    if (nextPatient) {
      try {
        await selectPatient(nextPatient);
      } catch (error) {
        console.error('Error selecting next patient:', error);
        setFeedbackMessage({ message: 'Failed to load next patient. Please try again.', type: 'error' });
      }
    } else {
      setFeedbackMessage({ message: 'No more patients in queue', type: 'success' });
    }
  };

  const analyzeCompleteness = (): WarningCategory[] => {
    const categories: WarningCategory[] = [];

    // Clinical notes
    const clinicalMissing: string[] = [];
    if (!consultation.chiefComplaint.trim()) clinicalMissing.push('Chief Complaint');
    if (!consultation.diagnosis.trim()) clinicalMissing.push('Diagnosis');
    if (!consultation.symptoms.trim()) clinicalMissing.push('Symptoms');
    if (!consultation.clinicalObservations.trim()) clinicalMissing.push('Clinical Observations');
    if (!consultation.doctorNotes.trim()) clinicalMissing.push('Doctor Notes');
    if (clinicalMissing.length > 0) {
      categories.push({ label: 'Clinical Notes', icon: 'clinical', fields: clinicalMissing });
    }

    // Vitals
    const vitalsMissing: string[] = [];
    if (!vitals.bloodPressure.trim()) vitalsMissing.push('Blood Pressure');
    if (!vitals.pulse.trim()) vitalsMissing.push('Heart Rate');
    if (!vitals.temperature.trim()) vitalsMissing.push('Temperature');
    if (!vitals.weight.trim()) vitalsMissing.push('Weight');
    if (!vitals.spo2.trim()) vitalsMissing.push('SpO2');
    if (!vitals.respiratoryRate.trim()) vitalsMissing.push('Respiratory Rate');
    if (!vitals.height.trim()) vitalsMissing.push('Height');
    if (vitalsMissing.length > 0) {
      categories.push({ label: 'Vitals', icon: 'vitals', fields: vitalsMissing });
    }

    // Prescription
    if (medicines.length === 0) {
      categories.push({ label: 'Prescription', icon: 'prescription', fields: ['No medicines prescribed'] });
    } else {
      const incompleteMeds = medicines.filter(m => !m.name.trim() || !m.dosage.trim() || !m.frequency.trim());
      if (incompleteMeds.length > 0) {
        categories.push({ label: 'Prescription', icon: 'prescription', fields: [`${incompleteMeds.length} medicine(s) with incomplete details`] });
      }
    }

    // Lab tests
    if (consultation.labTestsRecommended.length === 0) {
      categories.push({ label: 'Lab Tests', icon: 'lab', fields: ['No lab tests recommended'] });
    }

    // Follow-up
    if (!consultation.followUpDate) {
      categories.push({ label: 'Follow-up', icon: 'followup', fields: ['No follow-up date set'] });
    }

    return categories;
  };

  const handleProceedAnyway = async () => {
    setShowWarningDialog(false);
    setShowFieldWarnings(false);
    // Proceed directly to save with COMPLETED status, bypassing validation
    await submitConsultation('complete');
  };

  const submitConsultation = async (action: 'save' | 'complete') => {
    if (!selectedPatient) return;

    setSaving(true);
    try {
      const payload = {
        patientId: selectedPatient.patientId,
        appointmentId: selectedPatient.appointmentId,
        vitals,
        chiefComplaint: consultation.chiefComplaint || '',
        symptoms: consultation.symptoms || '',
        diagnosis: consultation.diagnosis || '',
        clinicalObservations: consultation.clinicalObservations || '',
        doctorNotes: consultation.doctorNotes || '',
        labTestsRecommended: consultation.labTestsRecommended || [],
        followUpDate: consultation.followUpDate || null,
        additionalRemarks: consultation.additionalRemarks || '',
        medicines: medicines.map(med => ({
          name: med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.instructions || '',
        })),
        status: action === 'complete' ? 'COMPLETED' : 'DRAFT',
      };

      await doctorAPI.saveConsultation(payload);

      if (action === 'complete') {
        const updatedQueue = queue.map(p =>
          p.id === selectedPatient.id ? { ...p, status: 'COMPLETED' as const } : p
        );
        setQueue(updatedQueue);
        setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
        fetchQueue();

        const nextPatient = updatedQueue.find(p => p.status === 'WAITING');
        if (nextPatient) {
          selectPatient(nextPatient);
          setFeedbackMessage({ message: 'Consultation completed. Loading next patient...', type: 'success' });
        } else {
          setSelectedPatient(null);
          setFeedbackMessage({ message: 'Consultation completed. No more patients in queue.', type: 'success' });
        }
      } else {
        setFeedbackMessage({ message: 'Consultation saved as draft', type: 'success' });
      }
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      console.error('Error response:', error?.response?.data);

      const errorCode = error?.response?.data?.error;
      if (errorCode === 'ALREADY_COMPLETED') {
        setFeedbackMessage({ message: 'This consultation has already been completed.', type: 'error' });
        fetchQueue();
        if (selectedPatient) {
          setQueue(prev =>
            prev.map(p =>
              p.id === selectedPatient.id ? { ...p, status: 'COMPLETED' as const } : p
            )
          );
        }
        setSelectedPatient(null);
        return;
      }

      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          error?.message ||
                          'Failed to save consultation. Please try again.';
      setFeedbackMessage({ message: `Failed to save consultation: ${errorMessage}`, type: 'error' });
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
    if (patient.status === 'IN_PROGRESS' || patient.status === 'WITH_DOCTOR') {
      return 'bg-blue-50 border-blue-300 ring-2 ring-blue-500';
    }
    return 'bg-white border-secondary-200 hover:border-primary-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS':
      case 'WITH_DOCTOR':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-secondary-400" />;
    }
  };

  const getPatientInitials = (patient: QueuePatient) => {
    return `${patient.patient.firstName[0]}${patient.patient.lastName[0]}`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const viewRecordDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const viewLabReportDetails = (report: LabReport) => {
    setSelectedLabReport(report);
    setShowLabReportModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'SAMPLE_COLLECTED':
        return 'bg-purple-100 text-purple-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-secondary-50">
      {/* Feedback Message Toast */}
      {feedbackMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
          feedbackMessage.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {feedbackMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {feedbackMessage.message}
        </div>
      )}

      {/* Top Section - Daily Summary */}
      <div className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-secondary-900">Doctor Consultation</h1>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Compact Stats Cards */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Today</p>
                <p className="text-lg font-bold text-blue-700">{stats.totalPatients}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Completed</p>
                <p className="text-lg font-bold text-green-700">{stats.completed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600 font-medium">Remaining</p>
                <p className="text-lg font-bold text-amber-700">{stats.remaining}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Patient Queue */}
        <div
          className={`${isQueueCollapsed ? 'w-16' : 'w-72'} flex-shrink-0 bg-white border-r border-secondary-200 flex flex-col transition-all duration-300 ease-in-out`}
        >
          {/* Queue Header */}
          <div className="px-3 py-3 border-b border-secondary-200 flex items-center justify-between">
            {!isQueueCollapsed && (
              <>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary-600" />
                  <h2 className="font-semibold text-secondary-900">Queue</h2>
                </div>
                <span className="text-sm text-secondary-500">
                  {queue.filter(p => p.status !== 'COMPLETED').length} waiting
                </span>
              </>
            )}
            <button
              onClick={() => setIsQueueCollapsed(!isQueueCollapsed)}
              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
              title={isQueueCollapsed ? 'Expand queue' : 'Collapse queue'}
            >
              {isQueueCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-secondary-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-secondary-600" />
              )}
            </button>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {queue.length === 0 ? (
              !isQueueCollapsed && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-secondary-300 mb-3" />
                  <p className="text-sm text-secondary-500">No patients in queue</p>
                </div>
              )
            ) : (
              queue.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  disabled={patient.status === 'COMPLETED'}
                  className={`w-full ${isQueueCollapsed ? 'p-2 justify-center' : 'p-2 text-left'} rounded-lg border transition-all duration-200 ${getPatientCardStyle(patient)} ${
                    selectedPatient?.id === patient.id ? 'ring-2 ring-primary-500' : ''
                  } ${patient.status === 'COMPLETED' ? 'cursor-default opacity-60' : 'cursor-pointer hover:shadow-md'} flex items-center gap-2`}
                >
                  {isQueueCollapsed ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      patient.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700' 
                        : patient.status === 'IN_PROGRESS' || patient.status === 'WITH_DOCTOR'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-primary-100 text-primary-700'
                    }`}>
                      {patient.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        getPatientInitials(patient)
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex-shrink-0">
                        {getStatusIcon(patient.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-secondary-900 truncate text-sm">
                            {patient.patient.firstName} {patient.patient.lastName}
                          </span>
                          <span className="text-xs font-bold text-primary-600">
                            #{patient.queueNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary-500">
                          <Clock className="w-3 h-3" />
                          <span>{patient.appointmentTime}</span>
                        </div>
                      </div>
                    </>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Consultation Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="px-4 py-3 border-b border-secondary-200 bg-gradient-to-r from-primary-50 to-healthcare-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">
                        {getPatientInitials(selectedPatient)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">
                        {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-secondary-600">
                        <span>PID: {selectedPatient.patientId.slice(-8)}</span>
                        <span>•</span>
                        <span>{calculateAge(selectedPatient.patient.dateOfBirth)} yrs, {selectedPatient.patient.gender}</span>
                        <span>•</span>
                        <span>{selectedPatient.appointmentTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPatient.patient.bloodGroup && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {selectedPatient.patient.bloodGroup}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPatient.status === 'IN_PROGRESS' || selectedPatient.status === 'WITH_DOCTOR'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedPatient.status === 'IN_PROGRESS' || selectedPatient.status === 'WITH_DOCTOR' ? 'In Progress' : 'Waiting'}
                    </span>
                  </div>
                </div>
                {selectedPatient.patient.allergies && selectedPatient.patient.allergies.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-red-700 font-medium">Allergies:</span>
                    <span className="text-red-600">{selectedPatient.patient.allergies.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-secondary-200 bg-white overflow-x-auto">
                <button
                  onClick={() => setActiveTab('vitals')}
                  className={`flex-1 min-w-[140px] px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'vitals'
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Vitals & Notes
                </button>
                <button
                  onClick={() => setActiveTab('prescription')}
                  className={`flex-1 min-w-[140px] px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'prescription'
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Prescription & Labs
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex-1 min-w-[140px] px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'records'
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Medical Records
                  {medicalRecords.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {medicalRecords.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('lab')}
                  className={`flex-1 min-w-[140px] px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'lab'
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  Lab Reports
                  {labReports.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {labReports.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'vitals' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Vitals Section */}
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-secondary-800 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Patient Vitals
                        </h4>
                        {selectedPatient.vitals && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Recorded by {selectedPatient.vitals.recordedBy?.name || 'Nurse'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-red-500" />
                            <label className="text-xs text-secondary-500">Blood Pressure</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.bloodPressure}
                            onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                            placeholder="120/80 mmHg"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <label className="text-xs text-secondary-500">Heart Rate</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            placeholder="72 bpm"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <label className="text-xs text-secondary-500">Temperature</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.temperature}
                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            placeholder="98.6°F"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Scale className="w-4 h-4 text-blue-500" />
                            <label className="text-xs text-secondary-500">Weight</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.weight}
                            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                            placeholder="70 kg"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-4 h-4 text-cyan-500" />
                            <label className="text-xs text-secondary-500">SpO2</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.spo2}
                            onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                            placeholder="98%"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="w-4 h-4 text-teal-500" />
                            <label className="text-xs text-secondary-500">Respiratory Rate</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.respiratoryRate}
                            onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                            placeholder="16/min"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="p-3 bg-secondary-50 rounded-lg col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Ruler className="w-4 h-4 text-purple-500" />
                            <label className="text-xs text-secondary-500">Height</label>
                          </div>
                          <input
                            type="text"
                            value={vitals.height}
                            onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                            placeholder="170 cm"
                            className="w-full rounded border-secondary-300 border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                      <h4 className="font-semibold text-secondary-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        Clinical Notes
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">
                            Chief Complaint
                            {showFieldWarnings && !consultation.chiefComplaint.trim() && (
                              <span className="ml-2 text-amber-600 font-medium">— Missing</span>
                            )}
                          </label>
                          <textarea
                            value={consultation.chiefComplaint}
                            onChange={(e) => setConsultation({ ...consultation, chiefComplaint: e.target.value })}
                            rows={2}
                            className={`w-full rounded-lg border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                              showFieldWarnings && !consultation.chiefComplaint.trim()
                                ? 'border-amber-400 bg-amber-50/30'
                                : 'border-secondary-300'
                            }`}
                            placeholder="Patient's main complaint..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">
                            Symptoms
                            {showFieldWarnings && !consultation.symptoms.trim() && (
                              <span className="ml-2 text-amber-600 font-medium">— Missing</span>
                            )}
                          </label>
                          <textarea
                            value={consultation.symptoms}
                            onChange={(e) => setConsultation({ ...consultation, symptoms: e.target.value })}
                            rows={2}
                            className={`w-full rounded-lg border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                              showFieldWarnings && !consultation.symptoms.trim()
                                ? 'border-amber-400 bg-amber-50/30'
                                : 'border-secondary-300'
                            }`}
                            placeholder="Associated symptoms..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">
                            Diagnosis
                            {showFieldWarnings && !consultation.diagnosis.trim() && (
                              <span className="ml-2 text-amber-600 font-medium">— Missing</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={consultation.diagnosis}
                            onChange={(e) => setConsultation({ ...consultation, diagnosis: e.target.value })}
                            className={`w-full rounded-lg border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                              showFieldWarnings && !consultation.diagnosis.trim()
                                ? 'border-amber-400 bg-amber-50/30'
                                : 'border-secondary-300'
                            }`}
                            placeholder="Working diagnosis..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">
                            Clinical Observations
                            {showFieldWarnings && !consultation.clinicalObservations.trim() && (
                              <span className="ml-2 text-amber-600 font-medium">— Missing</span>
                            )}
                          </label>
                          <textarea
                            value={consultation.clinicalObservations}
                            onChange={(e) => setConsultation({ ...consultation, clinicalObservations: e.target.value })}
                            rows={2}
                            className={`w-full rounded-lg border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                              showFieldWarnings && !consultation.clinicalObservations.trim()
                                ? 'border-amber-400 bg-amber-50/30'
                                : 'border-secondary-300'
                            }`}
                            placeholder="Physical examination findings..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary-500 mb-1">
                            Doctor Notes
                            {showFieldWarnings && !consultation.doctorNotes.trim() && (
                              <span className="ml-2 text-amber-600 font-medium">— Missing</span>
                            )}
                          </label>
                          <textarea
                            value={consultation.doctorNotes}
                            onChange={(e) => setConsultation({ ...consultation, doctorNotes: e.target.value })}
                            rows={2}
                            className={`w-full rounded-lg border p-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                              showFieldWarnings && !consultation.doctorNotes.trim()
                                ? 'border-amber-400 bg-amber-50/30'
                                : 'border-secondary-300'
                            }`}
                            placeholder="Additional clinical notes..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical History */}
                    {selectedPatient.patient.medicalHistory && selectedPatient.patient.medicalHistory.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 lg:col-span-2">
                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Medical History
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatient.patient.medicalHistory.map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prescription' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Prescription Section */}
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-secondary-800 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary-500" />
                          Prescription
                        </h4>
                        <button
                          onClick={addMedicine}
                          className="text-xs text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Medicine
                        </button>
                      </div>

                      {medicines.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500 text-sm border-2 border-dashed border-secondary-200 rounded-lg">
                          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                          No medicines added. Click "Add Medicine" to start prescription.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {medicines.map((medicine, index) => (
                            <div key={index} className="bg-secondary-50 rounded-lg p-3 border border-secondary-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded">
                                  Medicine {index + 1}
                                </span>
                                <button
                                  onClick={() => removeMedicine(index)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    value={medicine.name}
                                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                    className="w-full rounded border-secondary-300 border p-2 text-sm"
                                    placeholder="Medicine name"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={medicine.dosage}
                                  onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                  className="w-full rounded border-secondary-300 border p-2 text-sm"
                                  placeholder="Dosage (e.g., 500mg)"
                                />
                                <select
                                  value={medicine.frequency}
                                  onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                  className="w-full rounded border-secondary-300 border p-2 text-sm"
                                >
                                  <option value="">Frequency</option>
                                  <option value="OD">Once daily (OD)</option>
                                  <option value="BD">Twice daily (BD)</option>
                                  <option value="TDS">Three times (TDS)</option>
                                  <option value="QDS">Four times (QDS)</option>
                                  <option value="PRN">As needed (PRN)</option>
                                </select>
                                <input
                                  type="text"
                                  value={medicine.duration}
                                  onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                                  className="w-full rounded border-secondary-300 border p-2 text-sm"
                                  placeholder="Duration (e.g., 5 days)"
                                />
                                <input
                                  type="text"
                                  value={medicine.instructions}
                                  onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                                  className="w-full rounded border-secondary-300 border p-2 text-sm"
                                  placeholder="Instructions"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lab Tests & Follow-up */}
                    <div className="space-y-4">
                      {/* Lab Tests Section */}
                      <div className="bg-white rounded-lg border border-secondary-200 p-4">
                        <h4 className="font-semibold text-secondary-800 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-500" />
                          Lab Tests Recommended
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {availableLabTests.map((test) => (
                            <label key={test.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-secondary-50 rounded cursor-pointer">
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
                                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-secondary-700">{test.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Follow-up & Additional */}
                      <div className="bg-white rounded-lg border border-secondary-200 p-4">
                        <h4 className="font-semibold text-secondary-800 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-500" />
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
                    </div>
                  </div>
                )}

                {activeTab === 'records' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-secondary-800 flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-primary-500" />
                          Medical Records
                        </h4>
                        <span className="text-sm text-secondary-500">
                          {medicalRecords.length} record(s) found
                        </span>
                      </div>

                      {loadingRecords ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                          <span className="ml-2 text-secondary-600">Loading medical records...</span>
                        </div>
                      ) : medicalRecords.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                          <p>No medical records found for this patient</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {medicalRecords.map((record) => (
                            <div
                              key={record.id}
                              className="border border-secondary-200 rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 bg-secondary-50 cursor-pointer hover:bg-secondary-100"
                                onClick={() => toggleSection(`record-${record.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-primary-500" />
                                  <div>
                                    <p className="font-medium text-secondary-900">{record.diagnosis}</p>
                                    <p className="text-xs text-secondary-500">
                                      {record.date} • Dr. {record.doctorName} • {record.specialization}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {record.appointmentType}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewRecordDetails(record);
                                    }}
                                    className="p-1.5 hover:bg-primary-100 rounded text-primary-600"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {expandedSections[`record-${record.id}`] ? (
                                    <ChevronUp className="w-4 h-4 text-secondary-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-secondary-500" />
                                  )}
                                </div>
                              </div>
                              {expandedSections[`record-${record.id}`] && (
                                <div className="p-3 border-t border-secondary-200 bg-white">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {record.chiefComplaint && (
                                      <div>
                                        <p className="text-xs text-secondary-500 font-medium">Chief Complaint</p>
                                        <p className="text-secondary-700">{record.chiefComplaint}</p>
                                      </div>
                                    )}
                                    {record.prescription && (
                                      <div>
                                        <p className="text-xs text-secondary-500 font-medium">Prescription</p>
                                        <p className="text-secondary-700 whitespace-pre-line">{record.prescription}</p>
                                      </div>
                                    )}
                                    {record.notes && (
                                      <div>
                                        <p className="text-xs text-secondary-500 font-medium">Notes</p>
                                        <p className="text-secondary-700">{record.notes}</p>
                                      </div>
                                    )}
                                    {record.followUpDate && (
                                      <div>
                                        <p className="text-xs text-secondary-500 font-medium">Follow-up Date</p>
                                        <p className="text-secondary-700">{record.followUpDate}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Patient Uploaded Documents Section */}
                    <div className="bg-white rounded-lg border border-secondary-200 p-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-secondary-800 flex items-center gap-2">
                          <Upload className="w-5 h-5 text-teal-500" />
                          Patient Uploaded Documents
                        </h4>
                        <span className="text-sm text-secondary-500">
                          {patientDocuments.length} document(s) found
                        </span>
                      </div>

                      {loadingDocuments ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                          <span className="ml-2 text-secondary-600">Loading documents...</span>
                        </div>
                      ) : patientDocuments.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                          <Upload className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                          <p>No documents uploaded by patient</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="border border-secondary-200 rounded-lg p-3 bg-secondary-50 hover:bg-secondary-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {doc.fileType.includes('pdf') ? (
                                    <FileText className="w-8 h-8 text-red-500" />
                                  ) : doc.fileType.includes('image') ? (
                                    <FileText className="w-8 h-8 text-blue-500" />
                                  ) : (
                                    <FileText className="w-8 h-8 text-gray-500" />
                                  )}
                                  <div>
                                    <p className="font-medium text-secondary-900">{doc.documentName}</p>
                                    <p className="text-xs text-secondary-500">
                                      {doc.uploadDate} • {doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'} • {Math.round(doc.fileSize / 1024)} KB
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    doc.documentType === 'MEDICAL_RECORD' ? 'bg-blue-100 text-blue-700' :
                                    doc.documentType === 'LAB_REPORT' ? 'bg-purple-100 text-purple-700' :
                                    doc.documentType === 'PRESCRIPTION' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {doc.documentType.replace('_', ' ')}
                                  </span>
                                  <button
                                    onClick={() => {
                                      // Open document in new tab or modal
                                      if (doc.fileUrl.startsWith('data:')) {
                                        // Base64 data - open in new window
                                        // Validate that the data URL has expected format to prevent XSS
                                        const allowedPrefixes = ['data:image/', 'data:application/pdf'];
                                        const isAllowed = allowedPrefixes.some(prefix => doc.fileUrl.startsWith(prefix));
                                        
                                        if (!isAllowed) {
                                          console.error('Invalid file type for inline display');
                                          return;
                                        }
                                        
                                        const win = window.open('', '_blank');
                                        if (win) {
                                          if (doc.fileType.includes('pdf')) {
                                            win.document.write('<iframe style="width:100%; height:100%; border:none;"></iframe>');
                                            const iframe = win.document.querySelector('iframe');
                                            if (iframe) iframe.src = doc.fileUrl;
                                          } else {
                                            win.document.write('<img style="max-width:100%; height:auto;" />');
                                            const img = win.document.querySelector('img');
                                            if (img) img.src = doc.fileUrl;
                                          }
                                          win.document.close();
                                        }
                                      } else {
                                        window.open(doc.fileUrl, '_blank');
                                      }
                                    }}
                                    className="p-1.5 hover:bg-teal-100 rounded text-teal-600"
                                    title="View Document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {doc.notes && (
                                <p className="mt-2 text-xs text-secondary-600 border-t border-secondary-200 pt-2">
                                  {doc.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'lab' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-secondary-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-secondary-800 flex items-center gap-2">
                          <FlaskConical className="w-5 h-5 text-purple-500" />
                          Lab Reports
                        </h4>
                        <span className="text-sm text-secondary-500">
                          {labReports.length} report(s) found
                        </span>
                      </div>

                      {loadingLabReports ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                          <span className="ml-2 text-secondary-600">Loading lab reports...</span>
                        </div>
                      ) : labReports.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                          <FlaskConical className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                          <p>No lab reports found for this patient</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {labReports.map((report) => (
                            <div
                              key={report.id}
                              className="border border-secondary-200 rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center justify-between p-3 bg-secondary-50 cursor-pointer hover:bg-secondary-100"
                                onClick={() => toggleSection(`lab-${report.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <FlaskConical className="w-5 h-5 text-purple-500" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-secondary-900">{report.testName}</p>
                                      {report.isUrgent && (
                                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                          Urgent
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-secondary-500">
                                      {report.date} • {report.orderNumber} • Dr. {report.doctorName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                                    {report.status}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewLabReportDetails(report);
                                    }}
                                    className="p-1.5 hover:bg-purple-100 rounded text-purple-600"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {expandedSections[`lab-${report.id}`] ? (
                                    <ChevronUp className="w-4 h-4 text-secondary-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-secondary-500" />
                                  )}
                                </div>
                              </div>
                              {expandedSections[`lab-${report.id}`] && (
                                <div className="p-3 border-t border-secondary-200 bg-white">
                                  {/* Tests List */}
                                  <div className="mb-3">
                                    <p className="text-xs text-secondary-500 font-medium mb-2">Tests Ordered</p>
                                    <div className="flex flex-wrap gap-2">
                                      {report.tests.map((test) => (
                                        <span
                                          key={test.id}
                                          className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs"
                                        >
                                          {test.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Results Table */}
                                  {report.results.length > 0 && (
                                    <div>
                                      <p className="text-xs text-secondary-500 font-medium mb-2">Results</p>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-secondary-100">
                                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-600">Parameter</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-600">Value</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-600">Unit</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-600">Reference</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-secondary-600">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-secondary-200">
                                            {report.results.map((result) => (
                                              <tr key={result.id}>
                                                <td className="px-3 py-2 text-secondary-900">{result.parameter}</td>
                                                <td className="px-3 py-2 font-medium text-secondary-900">{result.value || '-'}</td>
                                                <td className="px-3 py-2 text-secondary-600">{result.unit || '-'}</td>
                                                <td className="px-3 py-2 text-secondary-600">{result.referenceRange || '-'}</td>
                                                <td className="px-3 py-2">
                                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                                    result.interpretation === 'NORMAL'
                                                      ? 'bg-green-100 text-green-700'
                                                      : result.interpretation === 'ABNORMAL'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                  }`}>
                                                    {result.interpretation}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {report.notes && (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <p className="text-xs text-yellow-800">
                                        <strong>Notes:</strong> {report.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 border-t border-secondary-200 bg-white flex items-center justify-between">
                <button
                  onClick={() => {
                    const tabs: Array<'vitals' | 'prescription' | 'records' | 'lab'> = ['vitals', 'prescription', 'records', 'lab'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    } else {
                      setActiveTab('vitals');
                    }
                  }}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium text-sm flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSubmit('save')}
                    disabled={saving}
                    className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSubmit('complete')}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Complete & Next
                  </button>
                </div>
                <button
                  onClick={() => {
                    const tabs: Array<'vitals' | 'prescription' | 'records' | 'lab'> = ['vitals', 'prescription', 'records', 'lab'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium text-sm flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
                <Stethoscope className="w-10 h-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Patient Selected</h3>
              <p className="text-sm text-secondary-500 max-w-sm mb-4">
                Select a patient from the queue on the left to begin the consultation.
              </p>
              {queue.filter(p => p.status === 'WAITING').length > 0 && (
                <button
                  onClick={handleNextPatient}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm flex items-center gap-2"
                >
                  Start Next Consultation
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Completion Warning Dialog */}
      {showWarningDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Incomplete Consultation</h3>
                <p className="text-sm text-secondary-600">
                  The following fields are missing or incomplete
                </p>
              </div>
              <button
                onClick={() => { setShowWarningDialog(false); setShowFieldWarnings(false); }}
                className="ml-auto p-1.5 hover:bg-amber-100 rounded-lg"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>

            {/* Warning Categories */}
            <div className="px-6 py-4 max-h-[360px] overflow-y-auto space-y-3">
              {warningCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-amber-100 bg-amber-50/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {cat.icon === 'clinical' && <FileText className="w-4 h-4 text-amber-600" />}
                    {cat.icon === 'vitals' && <Heart className="w-4 h-4 text-amber-600" />}
                    {cat.icon === 'prescription' && <Stethoscope className="w-4 h-4 text-amber-600" />}
                    {cat.icon === 'lab' && <FlaskConical className="w-4 h-4 text-amber-600" />}
                    {cat.icon === 'followup' && <Calendar className="w-4 h-4 text-amber-600" />}
                    <span className="text-sm font-semibold text-secondary-800">{cat.label}</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {cat.fields.map((field, fIdx) => (
                      <li key={fIdx} className="text-sm text-secondary-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setShowWarningDialog(false);
                  // Navigate to first tab with missing content
                  const hasClinical = warningCategories.some(c => c.icon === 'clinical' || c.icon === 'vitals');
                  const hasPrescription = warningCategories.some(c => c.icon === 'prescription' || c.icon === 'lab' || c.icon === 'followup');
                  if (hasClinical) setActiveTab('vitals');
                  else if (hasPrescription) setActiveTab('prescription');
                }}
                className="px-5 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-white font-medium text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Review & Update
              </button>
              <button
                onClick={handleProceedAnyway}
                disabled={saving}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Record Detail Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">Medical Record Details</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-1 hover:bg-secondary-100 rounded"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Date</p>
                    <p className="text-secondary-900">{selectedRecord.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Appointment Type</p>
                    <p className="text-secondary-900">{selectedRecord.appointmentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Doctor</p>
                    <p className="text-secondary-900">Dr. {selectedRecord.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Specialization</p>
                    <p className="text-secondary-900">{selectedRecord.specialization}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 font-medium">Diagnosis</p>
                  <p className="text-secondary-900 font-medium">{selectedRecord.diagnosis}</p>
                </div>
                {selectedRecord.chiefComplaint && (
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Chief Complaint</p>
                    <p className="text-secondary-900">{selectedRecord.chiefComplaint}</p>
                  </div>
                )}
                {selectedRecord.prescription && (
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Prescription</p>
                    <p className="text-secondary-900 whitespace-pre-line bg-secondary-50 p-3 rounded">{selectedRecord.prescription}</p>
                  </div>
                )}
                {selectedRecord.notes && (
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Notes</p>
                    <p className="text-secondary-900">{selectedRecord.notes}</p>
                  </div>
                )}
                {selectedRecord.followUpDate && (
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Follow-up Date</p>
                    <p className="text-secondary-900">{selectedRecord.followUpDate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Detail Modal */}
      {showLabReportModal && selectedLabReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-secondary-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-secondary-900">Lab Report Details</h3>
                {selectedLabReport.isUrgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Urgent</span>
                )}
              </div>
              <button
                onClick={() => setShowLabReportModal(false)}
                className="p-1 hover:bg-secondary-100 rounded"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Order Number</p>
                    <p className="text-secondary-900">{selectedLabReport.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Date</p>
                    <p className="text-secondary-900">{selectedLabReport.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Ordered By</p>
                    <p className="text-secondary-900">Dr. {selectedLabReport.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 font-medium">Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedLabReport.status)}`}>
                      {selectedLabReport.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-secondary-500 font-medium mb-2">Tests Ordered</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLabReport.tests.map((test) => (
                      <span
                        key={test.id}
                        className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                      >
                        {test.name}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedLabReport.results.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-500 font-medium mb-2">Test Results</p>
                    <div className="overflow-x-auto border border-secondary-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary-100">
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600">Parameter</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600">Value</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600">Unit</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600">Reference Range</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600">Interpretation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200">
                          {selectedLabReport.results.map((result) => (
                            <tr key={result.id}>
                              <td className="px-4 py-2 text-secondary-900 font-medium">{result.parameter}</td>
                              <td className="px-4 py-2 text-secondary-900 font-bold">{result.value || '-'}</td>
                              <td className="px-4 py-2 text-secondary-600">{result.unit || '-'}</td>
                              <td className="px-4 py-2 text-secondary-600">{result.referenceRange || '-'}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.interpretation === 'NORMAL'
                                    ? 'bg-green-100 text-green-700'
                                    : result.interpretation === 'ABNORMAL'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {result.interpretation}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedLabReport.notes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-medium mb-1">Notes</p>
                    <p className="text-yellow-900">{selectedLabReport.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
