import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Landing Page
import LandingPage from './pages/landing/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import PatientLogin from './pages/auth/PatientLogin';

// Dashboard Pages
import AdminDashboard from './pages/admin/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import NurseDashboard from './pages/nurse/Dashboard';
import PharmacyDashboard from './pages/pharmacy/Dashboard';
import LabDashboard from './pages/lab/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';

// Admin Pages
import StaffManagement from './pages/admin/StaffManagement';
import PatientRegistration from './pages/admin/PatientRegistration';
import Appointments from './pages/admin/Appointments';
import QueueManagement from './pages/admin/QueueManagement';
import Billing from './pages/admin/Billing';
import Reports from './pages/admin/Reports';

// Doctor Pages
import PatientQueue from './pages/doctor/PatientQueue';
import Consultation from './pages/doctor/Consultation';
import DoctorSchedule from './pages/doctor/Schedule';

// Nurse Pages
import RecordVitals from './pages/nurse/RecordVitals';
import PatientSearch from './pages/nurse/PatientSearch';

// Pharmacy Pages
import PendingPrescriptions from './pages/pharmacy/PendingPrescriptions';
import Inventory from './pages/pharmacy/Inventory';
import DispenseMedicine from './pages/pharmacy/DispenseMedicine';
import Bills from './pages/pharmacy/Bills';
import Expenses from './pages/pharmacy/Expenses';
import PharmacyReports from './pages/pharmacy/Reports';

// Lab Pages
import LabOrders from './pages/lab/LabOrders';
import SampleCollection from './pages/lab/SampleCollection';
import EnterResults from './pages/lab/EnterResults';
import TestCatalog from './pages/lab/TestCatalog';

// Patient Pages
import BookAppointment from './pages/patient/BookAppointment';
import MedicalRecords from './pages/patient/MedicalRecords';
import LabReports from './pages/patient/LabReports';
import MyPrescriptions from './pages/patient/MyPrescriptions';
import ProfileSetup from './pages/patient/ProfileSetup';
import PatientProfile from './pages/patient/Profile';

function App() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Protected route component
  const ProtectedRoute = ({
    children,
    allowedRoles
  }: {
    children: React.ReactNode;
    allowedRoles?: string[]
  }) => {
    // Wait for auth state to be rehydrated from localStorage
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-secondary-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  };

  // Get default dashboard based on role
  const getDefaultDashboard = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'NURSE':
        return '/nurse/dashboard';
      case 'PHARMACIST':
        return '/pharmacy/dashboard';
      case 'LAB_TECH':
        return '/lab/dashboard';
      case 'RECEPTIONIST':
        return '/admin/dashboard';
      case 'PATIENT':
        return '/patient/dashboard';
      default:
        return '/login';
    }
  };

  // Public route component - redirects authenticated users to their dashboard
  const PublicRoute = ({
    children
  }: {
    children: React.ReactNode
  }) => {
    // Wait for auth state to be rehydrated from localStorage
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-secondary-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (isAuthenticated) {
      return <Navigate to={getDefaultDashboard()} replace />;
    }

    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Landing Page - Public Route */}
      <Route path="/" element={<LandingPage />} />

      {/* ============================================
          AUTH ROUTES
          ============================================
          These routes are only accessible when not authenticated.
          
          DESIGN DECISION: Auth pages (Login, PatientLogin) use their own
          full-width two-column layouts instead of being wrapped in AuthLayout.
          This allows each auth page to have complete control over its visual
          presentation, including animated backgrounds and responsive layouts.
          
          If shared auth functionality is needed in the future, consider:
          - Creating a useAuthPage() hook for shared logic
          - Using a context provider for shared state
          ============================================ */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/patient-login"
        element={
          <PublicRoute>
            <PatientLogin />
          </PublicRoute>
        }
      />
      {/* Signup route uses PatientLogin component with signup mode (patient self-registration) */}
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <PatientLogin />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="patient-registration" element={<PatientRegistration />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="queue" element={<QueueManagement />} />
        <Route path="billing" element={<Billing />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Doctor Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="queue" element={<PatientQueue />} />
        <Route path="consultation" element={<Consultation />} />
        <Route path="consultation/:patientId" element={<Consultation />} />
        <Route path="schedule" element={<DoctorSchedule />} />
      </Route>

      {/* Nurse Routes */}
      <Route
        path="/nurse"
        element={
          <ProtectedRoute allowedRoles={['NURSE']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NurseDashboard />} />
        <Route path="search" element={<PatientSearch />} />
        <Route path="vitals" element={<RecordVitals />} />
        <Route path="vitals/:patientId" element={<RecordVitals />} />
      </Route>

      {/* Pharmacy Routes */}
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={['PHARMACIST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PharmacyDashboard />} />
        <Route path="prescriptions" element={<PendingPrescriptions />} />
        <Route path="dispense/:prescriptionId" element={<DispenseMedicine />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="bills" element={<Bills />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<PharmacyReports />} />
      </Route>

      {/* Lab Routes */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={['LAB_TECH']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="orders" element={<LabOrders />} />
        <Route path="sample/:orderId" element={<SampleCollection />} />
        <Route path="results/:orderId" element={<EnterResults />} />
        <Route path="catalog" element={<TestCatalog />} />
      </Route>

      {/* Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="profile/setup" element={<ProfileSetup />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="records" element={<MedicalRecords />} />
        <Route path="lab-reports" element={<LabReports />} />
        <Route path="prescriptions" element={<MyPrescriptions />} />
      </Route>

      {/* Redirect authenticated users to their dashboard */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultDashboard()} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Catch all - 404: Redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
