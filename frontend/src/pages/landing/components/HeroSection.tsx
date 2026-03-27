import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import {
  Calendar,
  Shield,
  Activity,
  Heart,
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Star,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Stethoscope,
  Brain,
  Bone,
  Baby,
  Eye,
  Pill,
} from 'lucide-react';

const SPECIALTIES = [
  { name: 'Cardiology', icon: Heart, color: 'text-rose-500' },
  { name: 'Neurology', icon: Brain, color: 'text-purple-500' },
  { name: 'Orthopedics', icon: Bone, color: 'text-blue-500' },
  { name: 'Pediatrics', icon: Baby, color: 'text-pink-500' },
  { name: 'Dermatology', icon: Eye, color: 'text-teal-500' },
  { name: 'General Medicine', icon: Pill, color: 'text-emerald-500' },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isDropdownOpen]);

  const { clearSession } = useAuthStore();

  const handleBookAppointment = () => {
    clearSession();
    navigate('/patient-login');
  };

  const handleStaffLogin = () => {
    clearSession();
    navigate('/login');
  };

  // Get next 7 dates for the date selector
  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const upcomingDates = getUpcomingDates();

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* ============================================
          DYNAMIC HERO BACKGROUND - MODERN HEALTHCARE
          Multi-layer animated system with medical aesthetics
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Deep medical gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#F0FDFA]" />
        
        {/* Layer 2: Animated flowing gradient overlay */}
        <div className="absolute inset-0 animate-hero-gradient-shift">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.08)_0%,transparent_50%,rgba(20,184,166,0.06)_100%)]" />
        </div>

        {/* Layer 3: Radial glow centers - medical trust points */}
        <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.12)_0%,transparent_70%)] animate-pulse-glow-1" />
        <div className="absolute bottom-[5%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)] animate-pulse-glow-2" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06)_0%,transparent_60%)] animate-pulse-glow-3" />

        {/* Layer 4: Modern mesh gradient orbs - animated */}
        <div className="hidden lg:block absolute top-[8%] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-300/[0.15] via-cyan-200/[0.08] to-transparent blur-[100px] animate-mesh-float-1" />
        <div className="hidden lg:block absolute bottom-[15%] left-[3%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/[0.12] via-emerald-200/[0.06] to-transparent blur-[90px] animate-mesh-float-2" />
        <div className="hidden xl:block absolute top-[35%] left-[40%] w-[350px] h-[350px] rounded-full bg-gradient-to-bl from-indigo-200/[0.1] via-blue-100/[0.05] to-transparent blur-[80px] animate-mesh-float-3" />
        <div className="hidden xl:block absolute bottom-[30%] right-[25%] w-[300px] h-[300px] rounded-full bg-gradient-to-tl from-cyan-200/[0.08] to-transparent blur-[70px] animate-mesh-float-4" />

        {/* Layer 5: Animated DNA helix pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dna-pattern" x="0" y="0" width="100" height="200" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="20" r="2" fill="#0EA5E9" className="animate-dna-particle-1" />
              <circle cx="75" cy="40" r="2" fill="#14B8A6" className="animate-dna-particle-2" />
              <circle cx="25" cy="60" r="2" fill="#0EA5E9" className="animate-dna-particle-3" />
              <circle cx="75" cy="80" r="2" fill="#14B8A6" className="animate-dna-particle-4" />
              <circle cx="25" cy="100" r="2" fill="#0EA5E9" className="animate-dna-particle-1" />
              <circle cx="75" cy="120" r="2" fill="#14B8A6" className="animate-dna-particle-2" />
              <circle cx="25" cy="140" r="2" fill="#0EA5E9" className="animate-dna-particle-3" />
              <circle cx="75" cy="160" r="2" fill="#14B8A6" className="animate-dna-particle-4" />
              <circle cx="25" cy="180" r="2" fill="#0EA5E9" className="animate-dna-particle-1" />
              <path d="M25 20 Q50 30 75 40 Q50 50 25 60 Q50 70 75 80 Q50 90 25 100 Q50 110 75 120 Q50 130 25 140 Q50 150 75 160 Q50 170 25 180" stroke="url(#dna-gradient)" strokeWidth="0.5" fill="none" />
            </pattern>
            <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#dna-pattern)" />
        </svg>

        {/* Layer 6: Floating medical particles */}
        <div className="hidden lg:block">
          {/* Plus signs - healthcare symbol */}
          <div className="absolute top-[15%] left-[10%] text-sky-400/20 animate-float-particle-medical text-2xl">+</div>
          <div className="absolute top-[45%] right-[15%] text-teal-400/15 animate-float-particle-medical-2 text-xl">+</div>
          <div className="absolute bottom-[25%] left-[25%] text-cyan-400/15 animate-float-particle-medical-3 text-lg">+</div>
          <div className="absolute top-[70%] right-[30%] text-sky-400/10 animate-float-particle-medical text-sm">+</div>
          
          {/* Heart pulses */}
          <div className="absolute top-[25%] right-[8%] w-3 h-3 rounded-full bg-rose-400/20 animate-heartbeat-pulse" />
          <div className="absolute bottom-[35%] left-[12%] w-2.5 h-2.5 rounded-full bg-rose-400/15 animate-heartbeat-pulse-2" />
          
          {/* Care crosses */}
          <div className="absolute top-[55%] left-[5%] w-4 h-4 border-2 border-sky-400/15 rotate-45 animate-care-cross-float" />
          <div className="absolute top-[20%] left-[60%] w-3 h-3 border-2 border-teal-400/15 rotate-45 animate-care-cross-float-2" />
        </div>

        {/* Layer 7: Subtle wave lines - ECG inspired */}
        <svg className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <defs>
            <linearGradient id="wave-gradient-hero" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
              <stop offset="30%" stopColor="#0EA5E9" stopOpacity="1" />
              <stop offset="70%" stopColor="#14B8A6" stopOpacity="1" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="animate-ecg-wave-hero"
            stroke="url(#wave-gradient-hero)"
            strokeWidth="2"
            fill="none"
            d="M0,60 L120,60 L140,60 L160,30 L180,90 L200,60 L220,60 L360,60 L380,60 L400,25 L420,95 L440,60 L460,60 L600,60 L620,60 L640,35 L660,85 L680,60 L700,60 L840,60 L860,60 L880,20 L900,100 L920,60 L940,60 L1080,60 L1100,60 L1120,30 L1140,90 L1160,60 L1180,60 L1320,60 L1340,60 L1360,35 L1380,85 L1400,60 L1440,60"
          />
        </svg>

        {/* Layer 8: Modern geometric accents */}
        <div className="hidden xl:block absolute top-[12%] right-[18%] w-[80px] h-[80px]">
          <div className="absolute inset-0 rounded-full border border-sky-300/20 animate-ring-pulse" />
          <div className="absolute inset-2 rounded-full border border-teal-300/15 animate-ring-pulse-2" />
        </div>
        <div className="hidden xl:block absolute bottom-[20%] left-[8%] w-[60px] h-[60px]">
          <div className="absolute inset-0 rounded-full border border-cyan-300/15 animate-ring-pulse-3" />
        </div>

        {/* Layer 9: Gradient mesh overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/20" />
        
        {/* Layer 10: Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* ============================================
          STICKY NAVIGATION
          ============================================ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 nav-sticky ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-lg shadow-blue-900/[0.06] py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all duration-500 group-hover:shadow-blue-500/40 group-hover:scale-105">
              <Heart className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${
                isScrolled ? 'text-slate-900' : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
              }`}>HMS</span>
              <span className="text-[10px] text-slate-400 -mt-0.5 tracking-widest font-medium">HEALTHCARE</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center gap-10">
            {[
              { href: '#specialties', label: 'Specialties' },
              { href: '#doctors', label: 'Our Doctors' },
              { href: '#trust', label: 'Why Us' },
              { href: '#faq', label: 'FAQ' }
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative font-medium text-[15px] group py-2 transition-colors duration-300 ${
                  isScrolled ? 'text-slate-600 hover:text-blue-600' : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStaffLogin}
              className="hidden sm:inline-flex relative items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-[15px] overflow-hidden transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">Login</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              {[
                { href: '#specialties', label: 'Specialties' },
                { href: '#doctors', label: 'Our Doctors' },
                { href: '#trust', label: 'Why Us' },
                { href: '#faq', label: 'FAQ' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-all duration-200"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => { handleStaffLogin(); setIsMobileMenuOpen(false); }}
                className="sm:hidden w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-center"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ============================================
          HERO CONTENT
          ============================================ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-220px)]">
          {/* LEFT SIDE - Main Content */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/60 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-slate-300/60 transition-all duration-300">
              <span className="flex items-center gap-2">
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <div className="absolute inset-0 bg-teal-400/30 blur-sm animate-pulse"></div>
                </div>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </span>
              <span className="text-sm font-medium text-slate-600">Trusted by 500+ Healthcare Facilities</span>
            </div>

            {/* Main Headline */}
            <div className="relative space-y-4">
              <div className="absolute -inset-8 bg-gradient-radial from-blue-400/10 via-teal-400/5 to-transparent rounded-3xl blur-2xl pointer-events-none"></div>
              <h1 className="relative font-bold text-[#0F172A] leading-[1.3] tracking-tight
                text-3xl sm:text-4xl md:text-[42px] lg:text-[50px] xl:text-[56px]">
                Smart Healthcare
                <br className="mb-2" />
                <span className="relative inline-block mt-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#14B8A6]">
                    Management System
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-teal-400/20" viewBox="0 0 300 12" preserveAspectRatio="none">
                    <path d="M0,8 Q75,0 150,8 T300,8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-[#64748B] leading-[1.6] max-w-[560px] font-normal">
                Streamline patient care, appointments, medical records, and hospital operations through our intelligent and secure healthcare platform.
              </p>
            </div>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">50K+</p>
                  <p className="text-xs text-slate-500">Patients Served</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">200+</p>
                  <p className="text-xs text-slate-500">Expert Doctors</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">4.9</p>
                  <p className="text-xs text-slate-500">Patient Rating</p>
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">HIPAA Compliant</span>
              </div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Real-time Analytics</span>
              </div>
            </div>
          </div>

          {/* ============================================
              RIGHT SIDE - APPOINTMENT BOOKING WIDGET
              ============================================ */}
          <div className="lg:col-span-6 relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 lg:inset-4 bg-gradient-radial from-blue-400/15 via-teal-400/8 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>

            <div className="relative animate-dashboard-fade-in">
              <div className="relative bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/[0.08] mx-auto lg:mx-0 lg:ml-auto" style={{ maxWidth: '480px' }}>
                {/* Card Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 p-6 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Book Appointment</h3>
                        <p className="text-blue-100 text-sm">Quick & Easy Scheduling</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-blue-100 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        15-min slots
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        In-person & Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="p-5 space-y-4">
                  {/* Specialty Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Select Specialty
                    </label>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      >
                        <span className={selectedSpecialty ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                          {selectedSpecialty || 'Choose a specialty...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown */}
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 z-20 overflow-hidden">
                          {SPECIALTIES.map((spec) => {
                            const Icon = spec.icon;
                            return (
                              <button
                                key={spec.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSpecialty(spec.name);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors text-sm ${
                                  selectedSpecialty === spec.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                                }`}
                              >
                                <Icon className={`w-4 h-4 ${spec.color}`} />
                                {spec.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Preferred Date
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {upcomingDates.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setSelectedDate(d.value)}
                          className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-center transition-all duration-200 ${
                            selectedDate === d.value
                              ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                              : 'bg-slate-50 border border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <span className={`text-[10px] font-medium ${
                            selectedDate === d.value ? 'text-blue-200' : 'text-slate-400'
                          }`}>
                            {d.isToday ? 'Today' : d.day}
                          </span>
                          <span className="text-base font-bold leading-tight mt-0.5">{d.date}</span>
                          <span className={`text-[9px] ${
                            selectedDate === d.value ? 'text-blue-200' : 'text-slate-400'
                          }`}>{d.month}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available doctors preview */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-3.5 border border-slate-100/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-slate-600">Available Doctors</span>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">15+ Online</span>
                    </div>
                    <div className="flex items-center -space-x-2">
                      {[
                        { initials: 'DR', gradient: 'from-blue-400 to-blue-500' },
                        { initials: 'SK', gradient: 'from-teal-400 to-teal-500' },
                        { initials: 'AR', gradient: 'from-violet-400 to-violet-500' },
                        { initials: 'PM', gradient: 'from-rose-400 to-rose-500' },
                        { initials: 'NK', gradient: 'from-amber-400 to-amber-500' },
                      ].map((doc, i) => (
                        <div
                          key={i}
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${doc.gradient} flex items-center justify-center border-2 border-white shadow-sm`}
                        >
                          <span className="text-[10px] text-white font-bold">{doc.initials}</span>
                        </div>
                      ))}
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-[10px] text-slate-500 font-bold">+10</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />
                      ))}
                      <span className="text-[10px] text-slate-500 ml-1">4.9 (2.5k+ reviews)</span>
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <button
                    onClick={handleBookAppointment}
                    className="w-full group relative flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold text-base overflow-hidden transition-all duration-500 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <Calendar className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Book Appointment Now</span>
                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    No registration fee &bull; Instant confirmation &bull; 24/7 support
                  </p>
                </div>
              </div>

              {/* Floating Badge - Top Right */}
              <div className="animate-notification-pop absolute -top-3 -right-3 bg-white rounded-xl shadow-xl shadow-slate-300/40 p-2.5 border border-slate-100/50 hidden xl:flex items-center gap-2 z-10">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-800">12 Slots Available</p>
                  <p className="text-[9px] text-slate-500">Today &bull; Cardiology</p>
                </div>
              </div>

              {/* Floating Badge - Bottom Left */}
              <div className="animate-notification-pop absolute -bottom-3 -left-3 bg-white rounded-xl shadow-xl shadow-slate-300/40 p-2.5 border border-slate-100/50 hidden xl:flex items-center gap-2 z-10" style={{ animationDelay: '0.5s' }}>
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-800">2,847 Appointments</p>
                  <p className="text-[9px] text-slate-500">Booked this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration — blends into section gradient */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <defs>
            <linearGradient id="wave-fill" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#F0FDFA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="url(#wave-fill)"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
