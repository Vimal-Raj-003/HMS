import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Phone,
  User,
  IdCard,
  Stethoscope,
  Calendar,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import api from '../../lib/api';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctor: Doctor;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  patientNumber: string;
  dateOfBirth: string;
  bloodGroup: string;
  gender: string;
  appointment?: Appointment;
}

export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'name' | 'id' | 'doctorName' | 'doctorId'>('phone');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchTypeOptions = [
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'name', label: 'Name', icon: User },
    { value: 'id', label: 'Patient ID', icon: IdCard },
    { value: 'doctorName', label: 'Doctor Name', icon: Stethoscope },
    { value: 'doctorId', label: 'Doctor ID', icon: IdCard },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await api.get(`/nurse/patients/search`, {
        params: {
          type: searchType,
          query: searchTerm,
        },
      });
      setResults(response.data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    if (patient.appointment) {
      navigate(`/nurse/vitals/${patient.id}?appointmentId=${patient.appointment.id}`);
    } else {
      navigate(`/nurse/vitals/${patient.id}`);
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

  const getPlaceholder = () => {
    switch (searchType) {
      case 'phone':
        return 'Enter phone number...';
      case 'name':
        return 'Enter patient name...';
      case 'id':
        return 'Enter patient ID...';
      case 'doctorName':
        return 'Enter doctor name...';
      case 'doctorId':
        return 'Enter doctor ID...';
      default:
        return 'Search...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Type Selection */}
          <div className="flex flex-wrap gap-2">
            {searchTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSearchType(option.value as typeof searchType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchType === option.value
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-secondary-50 text-secondary-600 border-2 border-transparent hover:bg-secondary-100'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
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
                placeholder={getPlaceholder()}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/nurse/vitals"
          className="bg-primary-50 border border-primary-200 text-primary-700 p-4 rounded-xl hover:bg-primary-100 transition text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <div className="font-semibold">Record Vitals</div>
            <div className="text-sm opacity-80">Record patient vital signs</div>
          </div>
        </Link>
        <Link
          to="/nurse/dashboard"
          className="bg-secondary-50 border border-secondary-200 text-secondary-700 p-4 rounded-xl hover:bg-secondary-100 transition text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <div className="font-semibold">Dashboard</div>
            <div className="text-sm opacity-80">View today's overview</div>
          </div>
        </Link>
      </div>

      {/* Search Results */}
      {searched && (
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <div className="p-4 border-b border-secondary-100">
            <h2 className="text-lg font-semibold text-secondary-900">Search Results</h2>
            <p className="text-sm text-secondary-500">
              {results.length} patient{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-secondary-600 font-medium">No patients found</p>
              <p className="text-sm text-secondary-500 mt-1">Try a different search term or criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-lg">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-secondary-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-secondary-500 flex items-center gap-2">
                        <span>ID: {patient.patientNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-secondary-500">
                          Age: {calculateAge(patient.dateOfBirth)} yrs • {patient.gender}
                        </span>
                        {patient.bloodGroup && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            {patient.bloodGroup}
                          </span>
                        )}
                      </div>
                      {patient.appointment && (
                        <div className="mt-2 p-2 bg-primary-50 rounded-lg text-xs">
                          <div className="flex items-center gap-2 text-primary-700">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span className="font-medium">
                              {patient.appointment.doctor.firstName} {patient.appointment.doctor.lastName}
                            </span>
                            <span className="text-primary-500">•</span>
                            <span>{patient.appointment.doctor.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-primary-600 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(patient.appointment.appointmentDate).toLocaleDateString()}
                            </span>
                            <span className="text-primary-500">•</span>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{patient.appointment.appointmentTime}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary-600 font-medium">Record Vitals</span>
                    <ChevronRight className="w-5 h-5 text-secondary-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
