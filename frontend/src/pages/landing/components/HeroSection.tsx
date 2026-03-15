import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Shield, 
  Activity, 
  Heart, 
  Stethoscope, 
  ClipboardList,
  ChevronRight,
  Clock,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  // Navigate to Patient Login for appointment booking
  const handleBookAppointment = () => {
    navigate('/patient-login');
  };

  // Navigate to Staff Login for hospital staff
  const handleStaffLogin = () => {
    navigate('/login');
  };

  // Navigate to Patient Login for slot checking
  const handleCheckSlots = () => {
    navigate('/patient-login');
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 overflow-hidden">
      {/* ============================================
          ENHANCED HERO BACKGROUND - FUTURISTIC DESIGN
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Layer 1: Primary Diagonal Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-teal-100/30"></div>
        
        {/* Layer 2: Radial Gradient Glow - Center Focus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)]"></div>
        
        {/* Layer 3: Primary gradient orb - top right - Hidden on mobile */}
        <div className="hidden md:block absolute -top-40 -right-40 lg:w-[700px] lg:h-[700px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-blue-500/20 via-blue-400/12 to-teal-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Layer 4: Secondary gradient orb - left side - Hidden on mobile */}
        <div className="hidden lg:block absolute top-1/3 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/15 via-cyan-400/10 to-blue-400/8 rounded-full blur-3xl animate-float-orb"></div>
        
        {/* Layer 5: Tertiary accent orb - bottom center - Hidden on tablet and below */}
        <div className="hidden xl:block absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-blue-400/10 via-teal-400/8 to-transparent rounded-full blur-2xl animate-pulse-slow-alt"></div>
        
        {/* Layer 6: Mesh gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/15 via-transparent to-transparent"></div>
        
        {/* Layer 7: Modern dot grid pattern - Hidden on mobile */}
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_20%,transparent_70%)]"></div>
        
        {/* Layer 8: Healthcare-themed SVG Pattern Overlay - Hidden on tablet and below */}
        <svg className="hidden lg:block absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Medical Cross Pattern */}
            <pattern id="medical-cross" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect fill="none" width="120" height="120"/>
              <g fill="rgba(59,130,246,0.8)">
                <rect x="54" y="20" width="12" height="32" rx="2"/>
                <rect x="44" y="30" width="32" height="12" rx="2"/>
              </g>
              <g fill="rgba(20,184,166,0.6)" transform="translate(60, 60)">
                <rect x="4" y="0" width="8" height="20" rx="1.5"/>
                <rect x="0" y="4" width="20" height="8" rx="1.5"/>
              </g>
            </pattern>
            
            {/* ECG Heartbeat Line Pattern */}
            <pattern id="ecg-pattern" x="0" y="0" width="200" height="80" patternUnits="userSpaceOnUse">
              <path
                d="M0,40 L30,40 L40,40 L50,20 L60,60 L70,30 L80,50 L90,40 L120,40 L130,40 L140,25 L150,55 L160,35 L170,45 L180,40 L200,40"
                fill="none"
                stroke="rgba(59,130,246,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </pattern>
            
            {/* Medical Shield Pattern */}
            <pattern id="medical-shield" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
              <path
                d="M75,15 L120,35 L120,75 C120,100 100,125 75,135 C50,125 30,100 30,75 L30,35 Z"
                fill="none"
                stroke="rgba(20,184,166,0.4)"
                strokeWidth="1"
              />
              <rect x="68" y="45" width="14" height="35" rx="2" fill="rgba(20,184,166,0.3)"/>
              <rect x="58" y="55" width="34" height="14" rx="2" fill="rgba(20,184,166,0.3)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medical-cross)"/>
        </svg>
        
        {/* Layer 9: ECG Heartbeat Pattern - Subtle Animation - Desktop only */}
        <svg className="hidden xl:block absolute inset-0 w-full h-full opacity-[0.06] animate-ecg-slide" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="ecg-line" x="0" y="0" width="300" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M0,50 L40,50 L50,50 L65,15 L80,85 L95,35 L110,65 L125,50 L180,50 L190,50 L205,20 L220,80 L235,40 L250,60 L265,50 L300,50"
                fill="none"
                stroke="url(#ecg-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.4)"/>
                  <stop offset="50%" stopColor="rgba(20,184,166,0.6)"/>
                  <stop offset="100%" stopColor="rgba(59,130,246,0.4)"/>
                </linearGradient>
              </defs>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ecg-line)"/>
        </svg>
        
        {/* Layer 10: Floating Healthcare Icons - Desktop only */}
        <div className="hidden xl:block absolute top-[15%] left-[8%] w-16 h-16 opacity-[0.06] animate-float-medical-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="8" width="24" height="48" rx="4" stroke="currentColor" strokeWidth="2" className="text-blue-500"/>
            <rect x="28" y="16" width="8" height="8" rx="2" fill="currentColor" className="text-teal-500"/>
            <circle cx="32" cy="44" r="4" stroke="currentColor" strokeWidth="2" className="text-blue-400"/>
          </svg>
        </div>
        
        <div className="hidden xl:block absolute top-[25%] right-[12%] w-14 h-14 opacity-[0.05] animate-float-medical-icon-delayed">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 4L48 14V28C48 40 38 50 28 52C18 50 8 40 8 28V14L28 4Z" stroke="currentColor" strokeWidth="2" className="text-teal-500"/>
            <rect x="22" y="18" width="12" height="20" rx="2" fill="currentColor" className="text-blue-400" opacity="0.6"/>
            <rect x="18" y="24" width="20" height="8" rx="2" fill="currentColor" className="text-blue-400" opacity="0.6"/>
          </svg>
        </div>
        
        <div className="hidden xl:block absolute bottom-[30%] left-[15%] w-12 h-12 opacity-[0.05] animate-float-medical-icon-slow">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" className="text-blue-500"/>
            <path d="M24 12V24L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-500"/>
          </svg>
        </div>
        
        <div className="hidden 2xl:block absolute top-[60%] right-[8%] w-10 h-10 opacity-[0.04] animate-float-medical-icon-alt">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C12 4 6 10 6 18C6 28 20 36 20 36C20 36 34 28 34 18C34 10 28 4 20 4Z" stroke="currentColor" strokeWidth="1.5" className="text-red-400"/>
            <path d="M14 20L18 24L26 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"/>
          </svg>
        </div>
        
        {/* Layer 11: Soft blurred gradient circles for depth - Hidden on tablet and below */}
        <div className="hidden lg:block absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-gradient-radial from-blue-300/10 to-transparent rounded-full blur-3xl animate-depth-pulse"></div>
        <div className="hidden lg:block absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-gradient-radial from-teal-300/10 to-transparent rounded-full blur-3xl animate-depth-pulse-delayed"></div>
        
        {/* Layer 12: Floating particles effect - Hidden on mobile */}
        <div className="hidden md:block absolute top-1/3 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-float-particle"></div>
        <div className="hidden md:block absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-teal-400/30 rounded-full animate-float-particle-delayed"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-float-particle-slow"></div>
        <div className="hidden lg:block absolute top-[20%] left-[45%] w-1.5 h-1.5 bg-blue-300/25 rounded-full animate-float-particle"></div>
        <div className="hidden xl:block absolute bottom-[35%] left-[30%] w-1 h-1 bg-teal-300/30 rounded-full animate-float-particle-slow"></div>
        
        {/* Layer 13: Wave pattern at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/40 to-transparent"></div>
      </div>
      
      {/* Glow Effect Behind Hero Content Area - Hidden on tablet and below */}
      <div className="hidden lg:block absolute top-[20%] left-[5%] w-[500px] h-[400px] bg-gradient-radial from-blue-400/8 via-teal-400/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16 lg:mb-20">
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all duration-500 group-hover:shadow-blue-500/40 group-hover:scale-105">
              <Heart className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">HMS</span>
              <span className="text-[10px] text-slate-400 -mt-0.5 tracking-widest font-medium">HEALTHCARE</span>
            </div>
          </div>

          {/* Navigation Menu - Center */}
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
                className="relative text-slate-500 hover:text-blue-600 transition-colors duration-300 font-medium text-[15px] group py-2"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </a>
            ))}
          </div>

          {/* CTA Buttons - Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStaffLogin}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-slate-500 hover:text-blue-600 font-medium text-[15px] transition-all duration-300 hover:bg-slate-100/80 rounded-xl"
            >
              <Stethoscope className="w-4 h-4" />
              Staff Portal
            </button>
            <button
              onClick={handleBookAppointment}
              className="relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-[15px] overflow-hidden transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Calendar className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Book Appointment</span>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-220px)]">
          {/* Left Side - Main Content */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-8 lg:space-y-10">
            {/* Trust Badge - Modern Pill Style */}
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
            
            {/* Main Headline - Enhanced Typography with Glow */}
            <div className="relative space-y-5">
              {/* Glow effect behind headline */}
              <div className="absolute -inset-8 bg-gradient-radial from-blue-400/10 via-teal-400/5 to-transparent rounded-3xl blur-2xl pointer-events-none"></div>
              
              <h1 className="relative text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-bold text-slate-900 leading-[1.15] tracking-tight">
                Smart Healthcare
                <br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500">
                    Management System
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-teal-400/20" viewBox="0 0 300 12" preserveAspectRatio="none">
                    <path d="M0,8 Q75,0 150,8 T300,8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-lg font-normal">
                Streamline patient care, appointments, medical records, and hospital operations through our intelligent and secure healthcare platform.
              </p>
            </div>

            {/* CTA Buttons - Enhanced */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleBookAppointment}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-base overflow-hidden transition-all duration-500 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                <Calendar className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Book Appointment</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={handleStaffLogin}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-700 rounded-2xl font-semibold text-base border-2 border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <Stethoscope className="w-5 h-5" />
                Staff Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Feature Highlights - Minimal Badge Style */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md hover:border-emerald-300/60 transition-all duration-300 group cursor-default">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">HIPAA Compliant</span>
              </div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md hover:border-blue-300/60 transition-all duration-300 group cursor-default">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-700">Real-time Analytics</span>
              </div>
            </div>
          </div>

          {/* Right Side - Quick Appointment Widget with Glassmorphism */}
          <div className="lg:col-span-6 xl:col-span-7 relative">
            {/* Glow Effect Behind Quick Appointment Card */}
            <div className="absolute inset-0 lg:inset-4 bg-gradient-radial from-teal-400/10 via-blue-400/8 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
            
            <div className="relative lg:pl-4">
              {/* Main Card - Glassmorphism Style */}
              <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/30 p-8 border border-white/50 overflow-hidden">
                {/* Decorative gradient top line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500"></div>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-blue-50/30 pointer-events-none"></div>
                
                {/* Header */}
                <div className="relative flex items-center gap-4 mb-8">
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <Calendar className="w-7 h-7 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-400 rounded-2xl opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Quick Appointment</h3>
                    <p className="text-sm text-slate-500">Book your visit in seconds</p>
                  </div>
                </div>

                {/* Form */}
                <div className="relative space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-5 py-4 bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-400 text-slate-900 shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Specialty</label>
                    <select className="w-full px-5 py-4 bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer text-slate-700 shadow-sm hover:shadow-md">
                      <option>Choose a specialty...</option>
                      <option>Cardiology</option>
                      <option>Orthopedics</option>
                      <option>Neurology</option>
                      <option>Dermatology</option>
                      <option>Pediatrics</option>
                      <option>General Medicine</option>
                      <option>Ophthalmology</option>
                      <option>ENT</option>
                      <option>Gynecology</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCheckSlots}
                    className="group w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white rounded-xl font-semibold overflow-hidden transition-all duration-500 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Check Available Slots</span>
                    <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>

                {/* Trust badges - Simplified */}
                <div className="relative flex items-center justify-center gap-8 mt-8 pt-6 border-t border-slate-200/60">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Secure Booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Verified Doctors</span>
                  </div>
                </div>
              </div>

              {/* Floating Stat Cards - Enhanced Design */}
              <div className="absolute -left-8 top-1/4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-4 border border-white/60 animate-float hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-xs text-slate-500 font-medium">Avg. Wait Time</p>
                    <p className="text-2xl font-bold text-slate-900">7 min</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 top-1/3 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-4 border border-white/60 animate-float-delayed hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-[100px]">
                    <p className="text-xs text-slate-500 font-medium">Patient Rating</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900">4.9</span>
                      <span className="text-amber-500 text-sm font-medium">/5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 left-1/4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-4 border border-white/60 animate-float-slow hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-xs text-slate-500 font-medium">Active Patients</p>
                    <p className="text-2xl font-bold text-slate-900">50K+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration - Enhanced */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.8"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
