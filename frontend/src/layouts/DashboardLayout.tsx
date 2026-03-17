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
  User,
  Activity,
  Stethoscope,
  ClipboardList,
  TestTube,
  CreditCard,
  BarChart3,
  Package,
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
    { name: 'Inventory', path: '/pharmacy/inventory', icon: Package },
    { name: 'Bills', path: '/pharmacy/bills', icon: CreditCard },
    { name: 'Expenses', path: '/pharmacy/expenses', icon: FileText },
    { name: 'Reports', path: '/pharmacy/reports', icon: BarChart3 },
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

// Role display names and colors - Futuristic badge styling
const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-purple-100/80 text-purple-700 border border-purple-200' },
  DOCTOR: { label: 'Doctor', color: 'bg-primary-100/80 text-primary-700 border border-primary-200' },
  NURSE: { label: 'Nurse', color: 'bg-green-100/80 text-green-700 border border-green-200' },
  PHARMACIST: { label: 'Pharmacist', color: 'bg-teal-100/80 text-teal-700 border border-teal-200' },
  LAB_TECH: { label: 'Lab Technician', color: 'bg-orange-100/80 text-orange-700 border border-orange-200' },
  PATIENT: { label: 'Patient', color: 'bg-navy-100/80 text-navy-700 border border-navy-200' },
  RECEPTIONIST: { label: 'Receptionist', color: 'bg-pink-100/80 text-pink-700 border border-pink-200' },
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
  const roleInfo = roleConfig[user?.role as keyof typeof roleConfig] || { label: user?.role, color: 'bg-navy-100/80 text-navy-700 border border-navy-200' };

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
    // TODO: Implement actual search functionality
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }}>
      {/* ============================================
          SIDEBAR - FUTURISTIC DARK NAVY THEME
          ============================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #020617 100%)',
          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.3)',
        }}
      >
        {/* Logo Area */}
        <div 
          className="flex items-center justify-between h-16 px-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ 
                background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">HMS</span>
              <span className="text-[10px] text-slate-400 -mt-0.5">Healthcare System</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-150"
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
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#E2E8F0',
                  borderLeft: isActive ? '3px solid rgba(255, 255, 255, 0.3)' : '3px solid transparent',
                  marginLeft: '-3px',
                  paddingLeft: 'calc(0.75rem + 3px)',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1E293B';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#E2E8F0';
                  }
                }}
              >
                <item.icon 
                  className="w-5 h-5 shrink-0 transition-colors duration-150"
                  style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div 
          className="p-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-3 px-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span className="text-xs font-semibold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{roleInfo.label}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* ============================================
            HEADER - LIGHT, CLEAN DESIGN
            ============================================ */}
        <header 
          className="sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 shrink-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderBottom: '1px solid #E2E8F0',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Left Section - Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title - Visible on larger screens */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#F1F5F9',
                    border: '1px solid transparent',
                    color: '#0F172A',
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.setProperty('--tw-ring-color', 'rgba(37, 99, 235, 0.15)');
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#F1F5F9';
                    e.target.style.borderColor = 'transparent';
                  }}
                />
              </div>
            </form>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150">
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors duration-150"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: '#94A3B8' }}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl z-50 overflow-hidden"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.15)',
                    animation: 'scaleIn 0.15s ease-out',
                  }}
                >
                  {/* User Info Header */}
                  <div 
                    className="px-4 py-3"
                    style={{ 
                      borderBottom: '1px solid #E2E8F0',
                      backgroundColor: 'rgba(248, 250, 252, 0.5)',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{user?.email}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1.5 ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to={user?.role === 'PATIENT' ? '/patient/profile' : `/${user?.role?.toLowerCase()}/settings`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                      style={{ color: '#475569' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User className="w-4 h-4" style={{ color: '#94A3B8' }} />
                      <span>My Profile</span>
                    </Link>
                    {user?.role !== 'PATIENT' && (
                      <Link
                        to={`/${user?.role?.toLowerCase()}/settings`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                        style={{ color: '#475569' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Settings className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        <span>Settings</span>
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="py-1" style={{ borderTop: '1px solid #E2E8F0' }}>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-sm transition-colors duration-150"
                      style={{ color: '#DC2626' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
        <main className="flex-1 p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>

        {/* ============================================
            FOOTER
            ============================================ */}
        <footer 
          className="px-4 sm:px-6 py-2.5 shrink-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderTop: '1px solid #E2E8F0',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs" style={{ color: '#64748B' }}>
            <p>© 2026 Hospital Management System. All rights reserved.</p>
            <p>Version 2.0.0 • Healthcare SaaS Platform</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
