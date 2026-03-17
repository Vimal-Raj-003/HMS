import { useEffect, useState, useRef } from 'react';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  X,
  Download,
  Printer,
  User,
  Calendar,
  Stethoscope,
  ClipboardList,
  Pill,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationDays: number;
  quantity: number;
  instructions: string;
}

interface DetailedPrescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  createdAt: string;
  status: string;
  notes: string;
  
  hospital: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    logo: string | null;
  };
  
  doctor: {
    name: string;
    firstName: string;
    lastName: string;
    specialization: string;
    qualifications: string;
    phone: string;
  };
  
  patient: {
    name: string;
    firstName: string;
    lastName: string;
    patientId: string;
    age: number | null;
    gender: string;
    phone: string;
    address: string | null;
    city: string | null;
    state: string | null;
    bloodGroup: string | null;
  };
  
  appointment: {
    date: string;
    time: string;
  } | null;
  
  diagnosis: string;
  chiefComplaint: string;
  advice: string;
  followUpDate: string | null;
  
  medicines: Medicine[];
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: string | null;
}

export default function PrescriptionModal({ isOpen, onClose, prescriptionId }: PrescriptionModalProps) {
  const [prescription, setPrescription] = useState<DetailedPrescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && prescriptionId) {
      fetchPrescriptionDetails();
    }
  }, [isOpen, prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    if (!prescriptionId) return;
    
    setLoading(true);
    try {
      const response = await patientPortalAPI.getPrescriptionById(prescriptionId);
      setPrescription(response.data);
    } catch (error: any) {
      console.error('Error fetching prescription details:', error);
      toast.error(error.response?.data?.message || 'Failed to load prescription details');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!prescription) return;
    
    setGeneratingPDF(true);
    
    try {
      // Create a downloadable HTML file that can be opened and printed as PDF
      const pdfContent = generatePDFHTML(prescription);
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescription.prescriptionNumber}-${prescription.date}.html`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Prescription downloaded as printable HTML file.');
    } catch (error: any) {
      console.error('Error downloading prescription:', error);
      toast.error('Failed to download prescription');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // HTML escape function to prevent XSS attacks
  const escapeHtml = (str: string | null | undefined): string => {
    if (str == null) return '';
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(str).replace(/[&<>"']/g, char => htmlEntities[char]);
  };

  const generatePDFHTML = (rx: DetailedPrescription): string => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - ${rx.prescriptionNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .prescription-container {
      border: 2px solid #1e40af;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .hospital-name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .hospital-address {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    
    .hospital-phone {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .prescription-title {
      background: #dbeafe;
      color: #1e40af;
      padding: 12px;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 2px;
      border-bottom: 2px solid #1e40af;
    }
    
    .content {
      padding: 24px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      gap: 8px;
    }
    
    .info-label {
      font-weight: 600;
      color: #4b5563;
      min-width: 100px;
    }
    
    .info-value {
      color: #1f2937;
    }
    
    .doctor-section {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    
    .doctor-name {
      font-size: 18px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 4px;
    }
    
    .doctor-specialization {
      color: #4b5563;
      font-style: italic;
    }
    
    .diagnosis-box {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    
    .medicines-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    
    .medicines-table th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .medicines-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .medicines-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .medicine-name {
      font-weight: 600;
      color: #1e40af;
    }
    
    .instructions {
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    
    .advice-box {
      background: #ecfdf5;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }
    
    .notes-box {
      background: #fef2f2;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }
    
    .signature-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #9ca3af;
    }
    
    .signature-line {
      width: 200px;
      border-top: 1px solid #1f2937;
      margin-top: 60px;
      margin-bottom: 8px;
    }
    
    .signature-name {
      font-weight: 600;
      color: #1f2937;
    }
    
    .signature-details {
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer {
      background: #f8fafc;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    
    .rx-symbol {
      font-size: 48px;
      font-weight: 700;
      color: #1e40af;
      margin-right: 12px;
    }
    
    .prescription-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .prescription-container {
        border: 2px solid #1e40af;
      }
      
      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <!-- Header -->
    <div class="header">
      <div class="hospital-name">${escapeHtml(rx.hospital.name)}</div>
      <div class="hospital-address">${escapeHtml(rx.hospital.address)}${rx.hospital.city ? `, ${escapeHtml(rx.hospital.city)}` : ''}${rx.hospital.state ? `, ${escapeHtml(rx.hospital.state)}` : ''} - ${escapeHtml(rx.hospital.pincode)}</div>
      <div class="hospital-phone">Phone: ${escapeHtml(rx.hospital.phone) || 'N/A'}</div>
    </div>
    
    <!-- Prescription Title -->
    <div class="prescription-title">
      <div class="prescription-header">
        <span class="rx-symbol">℞</span>
        <span>MEDICAL PRESCRIPTION</span>
      </div>
    </div>
    
    <div class="content">
      <!-- Prescription Info -->
      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Prescription No:</span>
            <span class="info-value">${escapeHtml(rx.prescriptionNumber)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date:</span>
            <span class="info-value">${formatDate(rx.date)}</span>
          </div>
          ${rx.appointment ? `
          <div class="info-item">
            <span class="info-label">Appointment:</span>
            <span class="info-value">${formatDate(rx.appointment.date)} at ${escapeHtml(rx.appointment.time)}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Doctor Information -->
      <div class="section">
        <div class="section-title">Doctor Information</div>
        <div class="doctor-section">
          <div class="doctor-name">${escapeHtml(rx.doctor.name)}</div>
          <div class="doctor-specialization">${escapeHtml(rx.doctor.specialization)}</div>
          ${rx.doctor.qualifications ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(rx.doctor.qualifications)}</div>` : ''}
        </div>
      </div>
      
      <!-- Patient Information -->
      <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${escapeHtml(rx.patient.name)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Patient ID:</span>
            <span class="info-value">${escapeHtml(rx.patient.patientId)}</span>
          </div>
          ${rx.patient.age ? `
          <div class="info-item">
            <span class="info-label">Age:</span>
            <span class="info-value">${rx.patient.age} years</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Gender:</span>
            <span class="info-value">${escapeHtml(rx.patient.gender)}</span>
          </div>
          ${rx.patient.bloodGroup ? `
          <div class="info-item">
            <span class="info-label">Blood Group:</span>
            <span class="info-value">${escapeHtml(rx.patient.bloodGroup)}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">${escapeHtml(rx.patient.phone)}</span>
          </div>
        </div>
      </div>
      
      <!-- Diagnosis -->
      ${rx.diagnosis ? `
      <div class="section">
        <div class="section-title">Diagnosis</div>
        <div class="diagnosis-box">
          ${rx.chiefComplaint ? `<p style="margin-bottom: 8px;"><strong>Chief Complaint:</strong> ${escapeHtml(rx.chiefComplaint)}</p>` : ''}
          <p><strong>Diagnosis:</strong> ${escapeHtml(rx.diagnosis)}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Medicines -->
      <div class="section">
        <div class="section-title">Prescribed Medicines</div>
        <table class="medicines-table">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 25%">Medicine</th>
              <th style="width: 12%">Dosage</th>
              <th style="width: 15%">Frequency</th>
              <th style="width: 12%">Duration</th>
              <th style="width: 31%">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${rx.medicines.map((med, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="medicine-name">${escapeHtml(med.name)}</td>
              <td>${escapeHtml(med.dosage)}</td>
              <td>${escapeHtml(med.frequency)}</td>
              <td>${escapeHtml(med.duration)}</td>
              <td class="instructions">${escapeHtml(med.instructions) || '-'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Advice -->
      ${rx.advice ? `
      <div class="section">
        <div class="section-title">Doctor's Advice</div>
        <div class="advice-box">
          <p>${escapeHtml(rx.advice)}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Notes -->
      ${rx.notes ? `
      <div class="section">
        <div class="section-title">Additional Notes</div>
        <div class="notes-box">
          <p>${escapeHtml(rx.notes)}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Follow-up -->
      ${rx.followUpDate ? `
      <div class="section">
        <div class="info-item">
          <span class="info-label">Follow-up Date:</span>
          <span class="info-value" style="color: #dc2626; font-weight: 600;">${formatDate(rx.followUpDate)}</span>
        </div>
      </div>
      ` : ''}
      
      <!-- Signature Section -->
      <div class="signature-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            ${rx.followUpDate ? `
            <p style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">⚠ Next Visit: ${formatDate(rx.followUpDate)}</p>
            ` : ''}
          </div>
          <div style="text-align: right;">
            <div class="signature-line"></div>
            <div class="signature-name">${escapeHtml(rx.doctor.name)}</div>
            <div class="signature-details">${escapeHtml(rx.doctor.specialization)}</div>
            ${rx.doctor.qualifications ? `<div class="signature-details">${escapeHtml(rx.doctor.qualifications)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>This is a computer-generated prescription and is valid only when signed by the prescribing doctor.</p>
      <p style="margin-top: 4px;">Generated on ${new Date().toLocaleString()} | ${escapeHtml(rx.hospital.name)}</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    if (!prescription) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const pdfContent = generatePDFHTML(prescription);
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prescription Details</h2>
                {prescription && (
                  <p className="text-sm text-gray-500">{prescription.prescriptionNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={!prescription || generatingPDF}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={downloadPDF}
                disabled={!prescription || generatingPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
              </div>
            ) : prescription ? (
              <div ref={printRef} className="p-6">
                {/* Prescription Preview */}
                <div className="border-2 border-[#1e40af] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {prescription.hospital.logo && (
                        <img src={prescription.hospital.logo} alt="Logo" className="w-12 h-12 rounded-full" />
                      )}
                      <h1 className="text-2xl font-bold">{prescription.hospital.name}</h1>
                    </div>
                    <p className="text-sm opacity-90">
                      {prescription.hospital.address}
                      {prescription.hospital.city && `, ${prescription.hospital.city}`}
                      {prescription.hospital.state && `, ${prescription.hospital.state}`}
                      {prescription.hospital.pincode && ` - ${prescription.hospital.pincode}`}
                    </p>
                    {prescription.hospital.phone && (
                      <p className="text-sm opacity-90 mt-1">Phone: {prescription.hospital.phone}</p>
                    )}
                  </div>

                  {/* Prescription Title */}
                  <div className="bg-blue-50 border-b-2 border-[#1e40af] py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-[#1e40af]">℞</span>
                      <span className="text-lg font-semibold text-[#1e40af] tracking-widest">MEDICAL PRESCRIPTION</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Prescription Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Prescription No:</span>
                        <p className="font-semibold">{prescription.prescriptionNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-semibold">{new Date(prescription.date).toLocaleDateString()}</p>
                      </div>
                      {prescription.appointment && (
                        <div>
                          <span className="text-gray-500">Appointment:</span>
                          <p className="font-semibold">
                            {new Date(prescription.appointment.date).toLocaleDateString()} at {prescription.appointment.time}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-[#1e40af]">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-[#1e40af]" />
                        <span className="text-sm font-semibold text-[#1e40af] uppercase tracking-wide">Doctor</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{prescription.doctor.name}</p>
                      <p className="text-gray-600">{prescription.doctor.specialization}</p>
                      {prescription.doctor.qualifications && (
                        <p className="text-sm text-gray-500">{prescription.doctor.qualifications}</p>
                      )}
                    </div>

                    {/* Patient Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-[#1e40af]" />
                        <span className="text-sm font-semibold text-[#1e40af] uppercase tracking-wide">Patient</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <p className="font-medium">{prescription.patient.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Patient ID:</span>
                          <p className="font-medium">{prescription.patient.patientId}</p>
                        </div>
                        {prescription.patient.age && (
                          <div>
                            <span className="text-gray-500">Age:</span>
                            <p className="font-medium">{prescription.patient.age} years</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Gender:</span>
                          <p className="font-medium capitalize">{prescription.patient.gender}</p>
                        </div>
                        {prescription.patient.bloodGroup && (
                          <div>
                            <span className="text-gray-500">Blood Group:</span>
                            <p className="font-medium">{prescription.patient.bloodGroup}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium">{prescription.patient.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis */}
                    {prescription.diagnosis && (
                      <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-500">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Diagnosis</span>
                        </div>
                        {prescription.chiefComplaint && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Chief Complaint:</span> {prescription.chiefComplaint}
                          </p>
                        )}
                        <p className="text-gray-900">{prescription.diagnosis}</p>
                      </div>
                    )}

                    {/* Medicines Table */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-4 h-4 text-[#1e40af]" />
                        <span className="text-sm font-semibold text-[#1e40af] uppercase tracking-wide">Prescribed Medicines</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#1e40af] text-white">
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Medicine</th>
                              <th className="px-3 py-2 text-left">Dosage</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-left">Duration</th>
                              <th className="px-3 py-2 text-left">Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescription.medicines.map((med, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-3 py-3 border-b">{index + 1}</td>
                                <td className="px-3 py-3 border-b font-medium text-[#1e40af]">{med.name}</td>
                                <td className="px-3 py-3 border-b">{med.dosage}</td>
                                <td className="px-3 py-3 border-b">{med.frequency}</td>
                                <td className="px-3 py-3 border-b">{med.duration}</td>
                                <td className="px-3 py-3 border-b text-gray-500 text-xs">{med.instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Advice */}
                    {prescription.advice && (
                      <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Doctor's Advice</span>
                        </div>
                        <p className="text-gray-900">{prescription.advice}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {prescription.notes && (
                      <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-400">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">Additional Notes</span>
                        </div>
                        <p className="text-gray-900">{prescription.notes}</p>
                      </div>
                    )}

                    {/* Follow-up */}
                    {prescription.followUpDate && (
                      <div className="flex items-center gap-2 text-red-600 font-semibold">
                        <Calendar className="w-4 h-4" />
                        <span>Follow-up Date: {new Date(prescription.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Signature */}
                    <div className="border-t border-dashed border-gray-300 pt-6 mt-6">
                      <div className="flex justify-between items-end">
                        <div>
                          {prescription.followUpDate && (
                            <p className="text-red-600 font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Next Visit: {new Date(prescription.followUpDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="w-48 border-t border-gray-400 mt-16 pt-2">
                            <p className="font-semibold">{prescription.doctor.name}</p>
                            <p className="text-sm text-gray-500">{prescription.doctor.specialization}</p>
                            {prescription.doctor.qualifications && (
                              <p className="text-xs text-gray-400">{prescription.doctor.qualifications}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 text-center text-xs text-gray-500 border-t">
                    <p>This is a computer-generated prescription and is valid only when signed by the prescribing doctor.</p>
                    <p className="mt-1">Generated on {new Date().toLocaleString()} | {prescription.hospital.name}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No prescription data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
