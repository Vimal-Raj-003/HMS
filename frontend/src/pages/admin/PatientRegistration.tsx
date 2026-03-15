import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Phone, Heart, Save, X } from 'lucide-react';
import api from '../../lib/api';
import CollapsibleCard from '../../components/ui/CollapsibleCard';

interface PatientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalHistory: string;
  allergies: string;
}

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PatientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalHistory: '',
    allergies: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/admin/patients', formData);
      alert(`Patient registered successfully! Patient ID: ${response.data.patientId}`);
      navigate('/admin/queue');
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information - Collapsible */}
        <CollapsibleCard
          title="Personal Information"
          subtitle="Basic patient details"
          icon={<User className="w-5 h-5 text-primary-600" />}
          iconBgColor="bg-primary-100"
          defaultCollapsed={false}
          collapsedContent={
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {formData.firstName && (
                <span className="text-secondary-600">
                  <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                </span>
              )}
              {formData.phone && (
                <span className="text-secondary-600">
                  <span className="font-medium">Phone:</span> {formData.phone}
                </span>
              )}
              {formData.dateOfBirth && (
                <span className="text-secondary-600">
                  <span className="font-medium">DOB:</span> {formData.dateOfBirth}
                </span>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                required
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </CollapsibleCard>

        {/* Address - Collapsible */}
        <CollapsibleCard
          title="Address"
          subtitle="Patient's residential address"
          icon={<MapPin className="w-5 h-5 text-green-600" />}
          iconBgColor="bg-green-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="text-sm text-secondary-600">
              {formData.address ? (
                <span>{formData.address.substring(0, 50)}{formData.address.length > 50 ? '...' : ''}</span>
              ) : (
                <span className="text-secondary-400 italic">No address provided</span>
              )}
            </div>
          }
        >
          <div>
            <label className="block text-sm font-medium text-secondary-700">Full Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
            />
          </div>
        </CollapsibleCard>

        {/* Emergency Contact - Collapsible */}
        <CollapsibleCard
          title="Emergency Contact"
          subtitle="Emergency contact information"
          icon={<Phone className="w-5 h-5 text-orange-600" />}
          iconBgColor="bg-orange-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {formData.emergencyContactName ? (
                <span className="text-secondary-600">
                  <span className="font-medium">Contact:</span> {formData.emergencyContactName}
                </span>
              ) : (
                <span className="text-secondary-400 italic">No emergency contact provided</span>
              )}
              {formData.emergencyContactPhone && (
                <span className="text-secondary-600">
                  <span className="font-medium">Phone:</span> {formData.emergencyContactPhone}
                </span>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Contact Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Medical Information - Collapsible */}
        <CollapsibleCard
          title="Medical Information"
          subtitle="Medical history and allergies"
          icon={<Heart className="w-5 h-5 text-red-600" />}
          iconBgColor="bg-red-100"
          defaultCollapsed={true}
          collapsedContent={
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {formData.medicalHistory ? (
                <span className="text-secondary-600">
                  <span className="font-medium">History:</span> {formData.medicalHistory.substring(0, 30)}...
                </span>
              ) : (
                <span className="text-secondary-400 italic">No medical history provided</span>
              )}
              {formData.allergies && (
                <span className="text-secondary-600">
                  <span className="font-medium">Allergies:</span> {formData.allergies.substring(0, 30)}...
                </span>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows={3}
                placeholder="Any previous medical conditions, surgeries, etc."
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={2}
                placeholder="Any known allergies (medications, food, etc.)"
                className="mt-1 block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
