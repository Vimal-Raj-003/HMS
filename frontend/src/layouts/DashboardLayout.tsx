import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  Users2,
  Pill,
  FlaskConical,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Bell,
  User,
  Activity,
  Stethoscope,
  ClipboardList,
  TestTube,
  CreditCard,
  BarChart3,
  Package,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import NotificationBell from '../components/NotificationBell';

const navigation = {
  ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Staff', path: '/admin/staff', icon: Users },
    { name: 'Patient Registration', path: '/admin/patient-registration', icon: Users2 },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Queue', path: '/admin/queue', icon: Activity },
    { name: 'Billing', path: '/admin/billing', icon: CreditCard },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ],
  DOCTOR: [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: Home },
    { name: 'Consultation', path: '/doctor/consultation', icon: Stethoscope },
    { name: 'Schedule', path: '/doctor/schedule', icon: Calendar },
  ],
  NURSE: [
    { name: 'Dashboard', path: '/nurse/dashboard', icon: Home },
    { name: 'Patient Search', path: '/nurse/search', icon: Search },
    { name: 'Record Vitals', path: '/nurse/vitals', icon: Activity },
  ],
  PHARMACIST: [
    { name: 'Dashboard', path: '/pharmacy/dashboard', icon: Home },
    { name: 'Prescriptions', path: '/pharmacy/prescriptions', icon: ClipboardList },
    { name: 'Dispense', path: '/pharmacy/dispense', icon: Pill },
    { name: 'Inventory', path: '/pharmacy/inventory', icon: Package },
    { name: 'Settings', path: '/pharmacy/settings', icon: Settings },
  ],
  LAB_TECH: [
    { name: 'Dashboard', path: '/lab/dashboard', icon: Home },
    { name: 'Orders', path: '/lab/orders', icon: FlaskConical },
    { name: 'Sample Collection', path: '/lab/samples', icon: TestTube },
    { name: 'Test Catalog', path: '/lab/catalog', icon: FileText },
    { name: 'Settings', path: '/lab/settings', icon: Settings },
  ],
  PATIENT: [
    { name: 'Dashboard', path: '/patient/dashboard', icon: Home },
    { name: 'Book Appointment', path: '/patient/book', icon: Calendar },
    { name: 'Medical Records', path: '/patient/records', icon: FileText },
    { name: 'Lab Reports', path: '/patient/lab-reports', icon: FlaskConical },
    { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
    { name: 'Profile', path: '/patient/profile', icon: User },
  ],
  RECEPTIONIST: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Patient Registration', path: '/admin/patient-registration', icon: Users2 },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Queue', path: '/admin/queue', icon: Activity },
    { name: 'Billing', path: '/admin/billing', icon: CreditCard },
  ],
};

// Role display names and colors
const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-purple-100 text-purple-700' },
  DOCTOR: { label: 'Doctor', color: 'bg-blue-100 text-blue-700' },
  NURSE: { label: 'Nurse', color: 'bg-green-100 text-green-700' },
  PHARMACIST: { label: 'Pharmacist', color: 'bg-teal-100 text-teal-700' },
  LAB_TECH: { label: 'Lab Technician', color: 'bg-orange-100 text-orange-700' },
  PATIENT: { label: 'Patient', color: 'bg-gray-100 text-gray-700' },
  RECEPTIONIST: { label: 'Receptionist', color: 'bg-pink-100 text-pink-700' },
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = navigation[user?.role as keyof typeof navigation] || [];
  const roleInfo = roleConfig[user?.role as keyof typeof roleConfig] || { label: user?.role, color: 'bg-gray-100 text-gray-700' };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality placeholder - does not modify existing logic
    console.log('Search:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* ============================================
          SIDEBAR
          ============================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 flex flex-col shadow-sidebar transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-healthcare-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-secondary-900 tracking-tight">HMS</span>
              <span className="text-[10px] text-secondary-400 -mt-0.5">Healthcare System</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems?.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-l-[3px] border-primary-600 -ml-[3px] pl-[calc(0.75rem+3px)]'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 border-l-[3px] border-transparent -ml-[3px] pl-[calc(0.75rem+3px)]'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 transition-colors duration-150 ${
                  isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* ============================================
            HEADER
            ============================================ */}
        <header className="sticky top-0 z-30 h-16 flex items-center border-b border-secondary-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 shrink-0">
          {/* Left Section - Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 transition-colors duration-150"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title - Visible on larger screens */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-secondary-900">
                {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl text-sm text-secondary-900 placeholder-secondary-400 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200"
                />
              </div>
            </form>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2.5 rounded-xl text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 transition-colors duration-150">
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-secondary-100 transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-semibold text-white">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-secondary-200 z-50 overflow-hidden animate-scale-in">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-secondary-100 bg-secondary-50/50">
                    <p className="text-sm font-medium text-secondary-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1.5 ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to={user?.role === 'PATIENT' ? '/patient/profile' : `/${user?.role?.toLowerCase()}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-150"
                    >
                      <User className="w-4 h-4 text-secondary-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to={`/${user?.role?.toLowerCase()}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors duration-150"
                    >
                      <Settings className="w-4 h-4 text-secondary-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-secondary-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ============================================
            PAGE CONTENT
            ============================================ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* ============================================
            FOOTER
            ============================================ */}
        <footer className="border-t border-secondary-200 bg-white/50 backdrop-blur-sm px-6 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary-500">
            <p>© 2026 Hospital Management System. All rights reserved.</p>
            <p>Version 2.0.0 • Healthcare SaaS Platform</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
