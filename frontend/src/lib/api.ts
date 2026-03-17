import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response - unwrap data from backend response format { success, message, data }
api.interceptors.response.use(
  (response) => {
    // If response has data.data (backend wraps in { success, data: {...} }), unwrap it
    // Return a new response object with unwrapped data, preserving original in meta
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      const { data: unwrappedData, ...meta } = response.data;
      return {
        ...response,
        data: unwrappedData,
        meta: { originalResponse: meta }, // Preserve success/message for debugging
      } as typeof response & { meta?: { originalResponse: unknown } };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-storage');
      
      // Redirect to appropriate login page based on current path
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/patient')) {
        window.location.href = '/patient-login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: any) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get('/auth/profile'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/password', { oldPassword, newPassword }),

  sendOTP: (mobile: string) =>
    api.post('/auth/send-otp', { mobile }),

  verifyOTP: (mobile: string, otp: string) =>
    api.post('/auth/verify-otp', { mobile, otp }),

  resendOTP: (mobile: string) =>
    api.post('/auth/resend-otp', { mobile }),
};

// Patient API (for staff to manage patients)
export const patientAPI = {
  sendOtp: (mobile: string, purpose: string) =>
    api.post('/patients/send-otp', { mobile, purpose }),

  verifyOtp: (mobile: string, otp: string) =>
    api.post('/patients/verify-otp', { mobile, otp }),

  register: (data: any) =>
    api.post('/patients/register', data),

  quickRegister: (data: any) =>
    api.post('/patients/quick-register', data),

  loginWithOtp: (mobile: string, otp: string, hospitalId: string) =>
    api.post('/patients/login', { mobile, otp, hospitalId }),

  search: (params: any) =>
    api.get('/patients/search', { params }),

  getById: (id: string) =>
    api.get(`/patients/${id}`),

  update: (id: string, data: any) =>
    api.put(`/patients/${id}`, data),

  getMedicalHistory: (id: string) =>
    api.get(`/patients/${id}/medical-history`),

  getVitals: (id: string, limit?: number) =>
    api.get(`/patients/${id}/vitals`, { params: { limit } }),

  getPrescriptions: (id: string) =>
    api.get(`/patients/${id}/prescriptions`),

  getLabReports: (id: string) =>
    api.get(`/patients/${id}/lab-reports`),

  addDependent: (id: string, data: any) =>
    api.post(`/patients/${id}/dependents`, data),

  getDependents: (id: string) =>
    api.get(`/patients/${id}/dependents`),
};

// Patient Portal API (for logged-in patients to access their own data)
export const patientPortalAPI = {
  // Profile
  getProfile: () =>
    api.get('/patient/profile'),

  updateProfile: (data: any) =>
    api.put('/patient/profile', data),

  // Doctors
  getDoctors: () =>
    api.get('/patient/doctors'),

  // Get available slots for a specific doctor on a date
  getDoctorSlots: (doctorId: string, date: string) =>
    api.get(`/patient/doctors/${doctorId}/slots`, { params: { date } }),

  // Get all specializations
  getSpecializations: () =>
    api.get('/patient/specializations'),

  // Appointments
  getAppointmentsUpcoming: () =>
    api.get('/patient/appointments/upcoming'),

  getTotalAppointments: () =>
    api.get('/patient/appointments/count'),

  bookAppointment: (data: any) =>
    api.post('/patient/appointments', data),

  // Medical Records
  getRecordsCount: () =>
    api.get('/patient/records/count'),

  getRecentRecords: () =>
    api.get('/patient/records/recent'),

  getRecords: () =>
    api.get('/patient/records'),

  // Prescriptions
  getPrescriptions: (status?: string) =>
    api.get('/patient/prescriptions', { params: status ? { status } : {} }),

  getPrescriptionById: (id: string) =>
    api.get(`/patient/prescriptions/${id}`),

  // Lab Reports
  getLabReports: (status?: string) =>
    api.get('/patient/lab-reports', { params: status ? { status } : {} }),

  // Uploaded Documents
  getDocuments: (type?: string) =>
    api.get('/patient/documents', { params: type ? { type } : {} }),

  uploadDocument: (data: FormData) =>
    api.post('/patient/documents', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deleteDocument: (id: string) =>
    api.delete(`/patient/documents/${id}`),
};

// Doctor API
export const doctorAPI = {
  getAll: (params?: any) =>
    api.get('/doctors', { params }),

  getById: (id: string) =>
    api.get(`/doctors/${id}`),

  getSlots: (id: string, date: string) =>
    api.get(`/doctors/${id}/slots`, { params: { date } }),

  getDashboardStats: () =>
    api.get('/doctors/dashboard-stats'),

  getSchedule: (params?: any) =>
    api.get('/doctors/schedule', { params }),

  getQueue: (date?: string) =>
    api.get('/doctors/queue', { params: date ? { date } : {} }),

  addTimeOff: (data: any) =>
    api.post('/doctors/time-offs', data),

  getTimeOffs: () =>
    api.get('/doctors/time-offs'),

  removeTimeOff: (id: string) =>
    api.delete(`/doctors/time-offs/${id}`),

  // Upcoming Appointments
  getUpcomingAppointments: () =>
    api.get('/doctors/appointments/upcoming'),

  getAppointmentDetails: (id: string) =>
    api.get(`/doctors/appointments/${id}`),

  acceptAppointment: (id: string) =>
    api.put(`/doctors/appointments/${id}/accept`),

  rejectAppointment: (id: string, reason: string) =>
    api.put(`/doctors/appointments/${id}/reject`, { reason }),

  rescheduleAppointment: (id: string, data: any) =>
    api.put(`/doctors/appointments/${id}/reschedule`, data),

  // Consultation endpoints
  startConsultation: (appointmentId: string) =>
    api.put(`/doctors/appointments/${appointmentId}/start`),

  saveConsultation: (data: any) =>
    api.post('/doctors/consultation', data),

  getConsultation: (appointmentId: string) =>
    api.get(`/doctors/consultation/${appointmentId}`),

  // Patient Records (for consultation)
  getPatientRecords: (patientId: string) =>
    api.get(`/doctors/patients/${patientId}/records`),

  getPatientLabReports: (patientId: string, status?: string) =>
    api.get(`/doctors/patients/${patientId}/lab-reports`, { params: { status } }),

  getPatientDocuments: (patientId: string, type?: string) =>
    api.get(`/doctors/patients/${patientId}/documents`, { params: type ? { type } : {} }),
};

// Notification API
export const notificationAPI = {
  getAll: (params?: any) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  getByAppointmentId: (appointmentId: string) =>
    api.get(`/notifications/appointment/${appointmentId}`),
};

// Nurse API
export const nurseAPI = {
  getDashboardStats: () =>
    api.get('/nurse/dashboard-stats'),

  searchPatients: (params: any) =>
    api.get('/nurse/patients/search', { params }),

  getPatientProfile: (id: string) =>
    api.get(`/nurse/patients/${id}/profile`),

  getQueue: () =>
    api.get('/nurse/queue'),

  recordVitals: (data: any) =>
    api.post('/nurse/vitals', data),

  getVitalsHistory: (patientId: string, limit?: number) =>
    api.get(`/nurse/patients/${patientId}/vitals-history`, { params: { limit } }),

  updateQueueStatus: (id: string, status: string) =>
    api.put(`/nurse/queue/${id}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    api.get('/admin/dashboard-stats'),

  getUsers: (params?: any) =>
    api.get('/admin/users', { params }),

  createUser: (data: any) =>
    api.post('/admin/users', data),

  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),

  deactivateUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  getDoctors: () =>
    api.get('/admin/doctors'),

  getAppointments: (params?: any) =>
    api.get('/admin/appointments', { params }),

  getQueue: () =>
    api.get('/admin/queue'),

  createWalkInAppointment: (data: any) =>
    api.post('/admin/walk-in-appointment', data),

  getPayouts: (params?: any) =>
    api.get('/admin/payouts', { params }),
};

// Pharmacy API
export const pharmacyAPI = {
  // Dashboard
  getDashboardStats: () =>
    api.get('/pharmacy/dashboard-stats'),

  // Prescriptions
  getPendingPrescriptions: (params?: any) =>
    api.get('/pharmacy/prescriptions/pending', { params }),

  getPrescription: (id: string) =>
    api.get(`/pharmacy/prescriptions/${id}`),

  // Medicines
  getMedicines: (params?: any) =>
    api.get('/pharmacy/medicines', { params }),

  createMedicine: (data: any) =>
    api.post('/pharmacy/medicines', data),

  getSubstitutes: (id: string) =>
    api.get(`/pharmacy/medicines/${id}/substitutes`),

  // Inventory
  getInventory: (params?: any) =>
    api.get('/pharmacy/inventory', { params }),

  addInventory: (data: any) =>
    api.post('/pharmacy/inventory', data),

  updateInventory: (id: string, data: any) =>
    api.put(`/pharmacy/inventory/${id}`, data),

  restockInventory: (id: string, quantity: number) =>
    api.post(`/pharmacy/inventory/${id}/restock`, { quantity }),

  getInventoryAlerts: () =>
    api.get('/pharmacy/inventory/alerts'),

  // Dispensing
  dispense: (data: any) =>
    api.post('/pharmacy/dispense', data),

  // Bills
  getBills: (params?: any) =>
    api.get('/pharmacy/bills', { params }),

  getBill: (id: string) =>
    api.get(`/pharmacy/bills/${id}`),

  getBillForDownload: (id: string) =>
    api.get(`/pharmacy/bills/${id}/download`),

  // Expenses
  getExpenses: (params?: any) =>
    api.get('/pharmacy/expenses', { params }),

  createExpense: (data: any) =>
    api.post('/pharmacy/expenses', data),

  updateExpense: (id: string, data: any) =>
    api.put(`/pharmacy/expenses/${id}`, data),

  deleteExpense: (id: string) =>
    api.delete(`/pharmacy/expenses/${id}`),

  // Reports
  getSalesReport: (params?: any) =>
    api.get('/pharmacy/reports/sales', { params }),

  getTopMedicinesReport: (params?: any) =>
    api.get('/pharmacy/reports/top-medicines', { params }),

  getStockTransactionsReport: (params?: any) =>
    api.get('/pharmacy/reports/stock-transactions', { params }),

  getExpenseReport: (params?: any) =>
    api.get('/pharmacy/reports/expenses', { params }),
};

// Lab API
export const labAPI = {
  getDashboardStats: () =>
    api.get('/lab/dashboard-stats'),

  getOrders: (params?: any) =>
    api.get('/lab/orders', { params }),

  getOrder: (id: string) =>
    api.get(`/lab/orders/${id}`),

  collectSample: (id: string, data: any) =>
    api.post(`/lab/orders/${id}/collect-sample`, data),

  submitResults: (id: string, data: any) =>
    api.post(`/lab/orders/${id}/results`, data),

  getTests: (params?: any) =>
    api.get('/lab/tests', { params }),

  createTest: (data: any) =>
    api.post('/lab/tests', data),

  getCategories: () =>
    api.get('/lab/categories'),
};

// Appointment API
export const appointmentAPI = {
  create: (data: any) =>
    api.post('/appointments', data),

  getById: (id: string) =>
    api.get(`/appointments/${id}`),

  cancel: (id: string, reason?: string) =>
    api.put(`/appointments/${id}/cancel`, { reason }),

  reschedule: (id: string, data: any) =>
    api.put(`/appointments/${id}/reschedule`, data),

  getByPatient: (patientId: string) =>
    api.get(`/appointments/patient/${patientId}`),
};

// Queue API
export const queueAPI = {
  getAll: (params?: any) =>
    api.get('/queue', { params }),

  callPatient: (id: string) =>
    api.post(`/queue/${id}/call`),

  startConsultation: (id: string) =>
    api.post(`/queue/${id}/start-consultation`),

  completeConsultation: (id: string) =>
    api.post(`/queue/${id}/complete`),

  holdPatient: (id: string, data: any) =>
    api.post(`/queue/${id}/hold`, data),

  resumePatient: (id: string) =>
    api.post(`/queue/${id}/resume`),

  skipPatient: (id: string) =>
    api.post(`/queue/${id}/skip`),

  updatePriority: (id: string, priority: number) =>
    api.put(`/queue/${id}/priority`, { priority }),

  transferPatient: (id: string, doctorId: string) =>
    api.post(`/queue/${id}/transfer`, { doctorId }),
};

// Billing API
export const billingAPI = {
  getBills: (params?: any) =>
    api.get('/billing/bills', { params }),

  getBill: (id: string) =>
    api.get(`/billing/bills/${id}`),

  createBill: (data: any) =>
    api.post('/billing/bills', data),

  processPayment: (id: string, data: any) =>
    api.post(`/billing/bills/${id}/payment`, data),

  getPayments: (params?: any) =>
    api.get('/billing/payments', { params }),

  getMasterBill: (visitId: string) =>
    api.get(`/billing/master-bill/${visitId}`),

  addLineItem: (visitId: string, data: any) =>
    api.post(`/billing/master-bill/${visitId}/line-item`, data),
};
