import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  consultationFee: number;
  qualifications?: string;
}

interface SlotInfo {
  slot: string;
  isAvailable: boolean;
}

interface DoctorSlots {
  doctor: {
    id: string;
    name: string;
    specialization: string;
    consultationFee: number;
  };
  date: string;
  slots: SlotInfo[];
}

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  dateOfBirth: Date | string | null;
  gender: string | null;
  weight: number | null;
  address: string | null;
}

// Required specializations
const REQUIRED_SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'General Medicine',
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [booking, setBooking] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('CONSULTATION');
  const [notes, setNotes] = useState('');
  const [slotsData, setSlotsData] = useState<DoctorSlots | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Check if profile is complete before allowing booking
  const isProfileComplete = (profile: PatientProfile): boolean => {
    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.email &&
      profile.dateOfBirth &&
      profile.gender &&
      profile.weight &&
      profile.address
    );
  };

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const response = await patientPortalAPI.getProfile();
      const profile = response.data as PatientProfile;
      
      if (!isProfileComplete(profile)) {
        toast.error('Please complete your profile before booking an appointment');
        navigate('/patient/profile/setup');
        return;
      }
      
      setCheckingProfile(false);
      fetchDoctors();
    } catch (error: any) {
      console.error('Error checking profile:', error);
      toast.error('Failed to verify profile. Please try again.');
      navigate('/patient/profile/setup');
    }
  };

  useEffect(() => {
    if (selectedSpecialization) {
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot('');
      setSlotsData(null);
    }
  }, [selectedSpecialization]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    } else {
      setSlotsData(null);
    }
    setSelectedSlot('');
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await patientPortalAPI.getDoctors();
      const doctorsData = response.data as Doctor[];
      setDoctors(doctorsData);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      toast.error(error.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const response = await patientPortalAPI.getDoctorSlots(selectedDoctor.id, selectedDate);
      
      // Check if doctor has time-off for this date
      if (response.data && response.data.slots && response.data.slots.length === 0) {
        // Doctor has marked this date as unavailable
        toast.error('Doctor is unavailable on this date. Please select another date.');
        setSlotsData(null);
        return;
      }
      
      setSlotsData(response.data as DoctorSlots);
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      toast.error(error.response?.data?.message || 'Failed to load available slots');
      setSlotsData(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Filter doctors by selected specialization
  const filteredDoctors = selectedSpecialization
    ? doctors.filter((d) => d.specialty === selectedSpecialization)
    : [];

  // Generate dates for next 15 days
  const generateAvailableDates = () => {
    const dates: { date: string; display: string; dayName: string }[] = [];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Group slots by session (morning/evening)
  const groupedSlots = slotsData?.slots.reduce(
    (acc, slotInfo) => {
      const hour = parseInt(slotInfo.slot.split(':')[0]);
      if (hour < 13) {
        acc.morning.push(slotInfo);
      } else {
        acc.evening.push(slotInfo);
      }
      return acc;
    },
    { morning: [] as SlotInfo[], evening: [] as SlotInfo[] }
  ) || { morning: [], evening: [] };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and time slot');
      return;
    }

    setBooking(true);
    try {
      await patientPortalAPI.bookAppointment({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedSlot,
        type: appointmentType,
        notes,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/dashboard');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  // Format time slot for display
  const formatSlotTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (loading || checkingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Step 1: Select Specialization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
          Select Specialization
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {REQUIRED_SPECIALIZATIONS.map((spec) => {
            const hasDoctors = doctors.some(d => d.specialty === spec);
            return (
              <button
                key={spec}
                onClick={() => hasDoctors && setSelectedSpecialization(spec)}
                disabled={!hasDoctors}
                className={`p-4 rounded-lg border text-sm font-medium transition ${
                  selectedSpecialization === spec
                    ? 'bg-blue-600 text-white border-blue-600'
                    : hasDoctors
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">
                    {spec === 'Cardiology' && '❤️'}
                    {spec === 'Dermatology' && '🧴'}
                    {spec === 'Orthopedics' && '🦴'}
                    {spec === 'Pediatrics' && '👶'}
                    {spec === 'General Medicine' && '🏥'}
                  </span>
                  {spec}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Doctor */}
      {selectedSpecialization && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
            Select Doctor
          </h2>
          {filteredDoctors.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No doctors available for this specialization</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setSelectedDate('');
                    setSelectedSlot('');
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedDoctor?.id === doctor.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {doctor.firstName[0]}
                        {doctor.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{doctor.specialty}</div>
                      {doctor.qualifications && (
                        <div className="text-xs text-gray-400">{doctor.qualifications}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">₹{doctor.consultationFee}</div>
                      <div className="text-xs text-gray-500">Consultation</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Date */}
      {selectedDoctor && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">3</span>
            Select Date
            <span className="ml-2 text-sm font-normal text-gray-500">(Next 15 days)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableDates.map((dateInfo) => (
              <button
                key={dateInfo.date}
                onClick={() => {
                  setSelectedDate(dateInfo.date);
                  setSelectedSlot('');
                }}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition min-w-[80px] ${
                  selectedDate === dateInfo.date
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="text-xs text-gray-400">{dateInfo.dayName}</div>
                <div className="font-semibold">{dateInfo.display}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Select Time Slot */}
      {selectedDoctor && selectedDate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">4</span>
            Select Time Slot
            <span className="ml-2 text-sm font-normal text-gray-500">(15-minute intervals)</span>
          </h2>
          
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : slotsData ? (
            <div className="space-y-6">
              {/* Morning Session */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                  <span className="mr-2">🌅</span> Morning Session (09:00 AM - 01:00 PM)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {groupedSlots.morning.map((slotInfo) => (
                    <button
                      key={slotInfo.slot}
                      onClick={() => slotInfo.isAvailable && setSelectedSlot(slotInfo.slot)}
                      disabled={!slotInfo.isAvailable}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        selectedSlot === slotInfo.slot
                          ? 'bg-green-600 text-white border-green-600'
                          : slotInfo.isAvailable
                          ? 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                      }`}
                      title={slotInfo.isAvailable ? 'Available' : 'Not Available'}
                    >
                      {formatSlotTime(slotInfo.slot)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening Session */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                  <span className="mr-2">🌆</span> Evening Session (02:00 PM - 08:00 PM)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {groupedSlots.evening.map((slotInfo) => (
                    <button
                      key={slotInfo.slot}
                      onClick={() => slotInfo.isAvailable && setSelectedSlot(slotInfo.slot)}
                      disabled={!slotInfo.isAvailable}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        selectedSlot === slotInfo.slot
                          ? 'bg-green-600 text-white border-green-600'
                          : slotInfo.isAvailable
                          ? 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                      }`}
                      title={slotInfo.isAvailable ? 'Available' : 'Not Available'}
                    >
                      {formatSlotTime(slotInfo.slot)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                  Available
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                  Selected
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                  Unavailable
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Select a date to see available slots</p>
          )}
        </div>
      )}

      {/* Step 5: Appointment Details */}
      {selectedDoctor && selectedDate && selectedSlot && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">5</span>
            Appointment Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
              >
                <option value="CONSULTATION">General Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe your symptoms or reason for visit..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedDoctor && selectedDate && selectedSlot && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 text-lg">Appointment Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Doctor:</span>
              <p className="text-gray-900">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Specialization:</span>
              <p className="text-gray-900">{selectedDoctor.specialty}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Date:</span>
              <p className="text-gray-900">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Time:</span>
              <p className="text-gray-900">{formatSlotTime(selectedSlot)}</p>
            </div>
            <div className="col-span-2 pt-3 border-t border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">Consultation Fee:</span>
                <span className="text-2xl font-bold text-gray-900">₹{selectedDoctor.consultationFee}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleBooking}
          disabled={booking || !selectedDoctor || !selectedDate || !selectedSlot}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {booking ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Booking...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
}
