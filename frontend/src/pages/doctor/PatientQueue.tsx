import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface QueuePatient {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  appointmentType: string;
  priority: string;
  waitingTime: string;
  vitals: {
    bloodPressure?: string;
    temperature?: string;
    pulse?: string;
    weight?: string;
  };
  status: string;
}

export default function PatientQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get('/doctor/queue');
      setQueue(response.data.queue);
      setCurrentPatient(response.data.currentPatient);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const callPatient = async (patientId: string) => {
    try {
      await api.post(`/doctor/queue/${patientId}/call`);
      fetchQueue();
    } catch (error) {
      console.error('Error calling patient:', error);
    }
  };

  const startConsultation = (patient: QueuePatient) => {
    navigate(`/doctor/consultation/${patient.patientId}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
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
      {/* Current Patient */}
      {currentPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-blue-600 font-medium">Currently Attending</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                #{currentPatient.tokenNumber} - {currentPatient.patientName}
              </h2>
              <p className="text-gray-600">{currentPatient.appointmentType}</p>
            </div>
            <button
              onClick={() => startConsultation(currentPatient)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start Consultation
            </button>
          </div>
        </div>
      )}

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Waiting</div>
          <div className="text-3xl font-bold text-yellow-600">
            {queue.filter(p => p.status === 'WAITING').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-3xl font-bold text-blue-600">
            {queue.filter(p => p.status === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Completed Today</div>
          <div className="text-3xl font-bold text-green-600">
            {queue.filter(p => p.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Waiting Patients</h2>
        </div>
        {queue.filter(p => p.status === 'WAITING').length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No patients waiting in queue
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue
              .filter(p => p.status === 'WAITING')
              .sort((a, b) => {
                if (a.priority === 'EMERGENCY') return -1;
                if (b.priority === 'EMERGENCY') return 1;
                return a.tokenNumber - b.tokenNumber;
              })
              .map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 hover:bg-gray-50 ${patient.priority === 'EMERGENCY' ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-blue-600">
                        #{patient.tokenNumber}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{patient.patientName}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(patient.priority)}`}>
                            {patient.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.appointmentType} • Waiting: {patient.waitingTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Vitals Preview */}
                      {patient.vitals && (
                        <div className="text-xs text-gray-500 text-right hidden md:block">
                          {patient.vitals.bloodPressure && <div>BP: {patient.vitals.bloodPressure}</div>}
                          {patient.vitals.temperature && <div>Temp: {patient.vitals.temperature}</div>}
                          {patient.vitals.pulse && <div>Pulse: {patient.vitals.pulse}</div>}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => callPatient(patient.id)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                        >
                          Call
                        </button>
                        <button
                          onClick={() => startConsultation(patient)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Consult
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
