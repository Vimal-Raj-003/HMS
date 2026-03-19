import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Shield,
  Activity,
  Heart,
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
    <section className="relative min-h-screen overflow-hidden">
      {/* ============================================
          HERO SECTION WITH TRANSPARENT BACKGROUND
          Background is handled by LandingPage.tsx
          ============================================ */}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Navigation - Clean and Minimal */}
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

          {/* CTA Button - Right Side - Single Login Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStaffLogin}
              className="relative inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-[15px] overflow-hidden transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10">Login</span>
            </button>
          </div>
        </nav>

        {/* Hero Content - Two Column Layout (55% / 45%) */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-220px)]">
          {/* Left Side - Main Content (55%) */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
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
            
            {/* Main Headline - Enhanced Typography */}
            <div className="relative space-y-4">
              {/* Glow effect behind headline */}
              <div className="absolute -inset-8 bg-gradient-radial from-blue-400/10 via-teal-400/5 to-transparent rounded-3xl blur-2xl pointer-events-none"></div>
              
              {/* Headline with proper typography hierarchy */}
              {/* Desktop: 56px, Tablet: 42px, Mobile: 32px | Font-weight: 700 | Line-height: 1.3 | Color: #0F172A */}
              <h1 className="relative font-bold text-[#0F172A] leading-[1.3] tracking-tight
                text-3xl
                sm:text-4xl
                md:text-[42px]
                lg:text-[56px]
                xl:text-[56px]">
                Smart Healthcare
                <br className="mb-2" />
                {/* Gradient text for "Management System" - #2563EB → #14B8A6 */}
                <span className="relative inline-block mt-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#14B8A6]">
                    Management System
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-teal-400/20" viewBox="0 0 300 12" preserveAspectRatio="none">
                    <path d="M0,8 Q75,0 150,8 T300,8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
              
              {/* Description - Font: Inter, Weight: 400, Size: 18px, Line-height: 1.6, Color: #64748B, Max-width: 560px */}
              <p className="text-lg text-[#64748B] leading-[1.6] max-w-[560px] font-normal">
                Streamline patient care, appointments, medical records, and hospital operations through our intelligent and secure healthcare platform.
              </p>
            </div>

            {/* CTA Button - Book Appointment with gradient styling */}
            {/* Button: Height 48px, Padding 16px 28px, Border-radius 12px, Font-weight 600 */}
            <div className="flex flex-row flex-wrap gap-4">
              <button
                onClick={handleBookAppointment}
                className="group relative inline-flex items-center gap-3 h-12 px-7 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white rounded-xl font-semibold text-base overflow-hidden transition-all duration-500 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
                style={{ padding: '16px 28px', borderRadius: '12px' }}
              >
                <Calendar className="w-5 h-5 relative z-10" />
                <span className="relative z-10 font-semibold">Book Appointment</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>

            {/* Feature Highlights - Badge Style */}
            {/* Background: #F1F5F9, Icon color: #2563EB */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default"
                style={{ backgroundColor: '#F1F5F9' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: '#2563EB' }}>
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">HIPAA Compliant</span>
              </div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default"
                style={{ backgroundColor: '#F1F5F9' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: '#2563EB' }}>
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Real-time Analytics</span>
              </div>
            </div>
          </div>

          {/* Right Side - Quick Appointment Widget (45%) */}
          <div className="lg:col-span-5 relative">
            {/* Glow Effect Behind Quick Appointment Card */}
            <div className="absolute inset-0 lg:inset-4 bg-gradient-radial from-teal-400/10 via-blue-400/8 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
            
            <div className="relative">
              {/* Main Card - Glassmorphism Style */}
              {/* Max-width: 420px, Padding: 24px, Border-radius: 16px, Soft elevation shadow */}
              <div 
                className="relative bg-white/80 backdrop-blur-xl border border-white/50 overflow-hidden mx-auto lg:mx-0 lg:ml-auto"
                style={{ 
                  maxWidth: '420px', 
                  padding: '24px', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)'
                }}>
                {/* Decorative gradient top line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500"></div>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-blue-50/30 pointer-events-none"></div>
                
                {/* Header */}
                <div className="relative flex items-center gap-4 mb-6">
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <Calendar className="w-6 h-6 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-400 rounded-xl opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Quick Appointment</h3>
                    <p className="text-sm text-slate-500">Book your visit in seconds</p>
                  </div>
                </div>

                {/* Form */}
                <div className="relative space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-400 text-slate-900 shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Specialty</label>
                    <select className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 appearance-none cursor-pointer text-slate-700 shadow-sm hover:shadow-md">
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
                    className="group w-full h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white rounded-xl font-semibold overflow-hidden transition-all duration-500 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 flex items-center justify-center gap-2"
                    style={{ borderRadius: '12px' }}
                  >
                    <ClipboardList className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Check Available Slots</span>
                    <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>

                {/* Trust badges - Simplified */}
                <div className="relative flex items-center justify-center gap-6 mt-6 pt-5 border-t border-slate-200/60">
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

              {/* Floating Stat Cards - Positioned OUTSIDE card boundaries to prevent overlap */}
              {/* Average Wait Time - Top Left (positioned to not overlap) */}
              <div className="absolute -left-6 -top-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-3 border border-white/60 animate-float hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/25">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-[70px]">
                    <p className="text-[10px] text-slate-500 font-medium">Avg. Wait Time</p>
                    <p className="text-xl font-bold text-slate-900">7 min</p>
                  </div>
                </div>
              </div>

              {/* Patient Rating - Top Right (positioned to not overlap) */}
              <div className="absolute -right-4 -top-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-3 border border-white/60 animate-float-delayed hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-[10px] text-slate-500 font-medium">Patient Rating</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">4.9</span>
                      <span className="text-amber-500 text-xs font-medium">/5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Patients - Bottom Left (positioned to not overlap) */}
              <div className="absolute -left-4 bottom-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-300/30 p-3 border border-white/60 animate-float-slow hover:shadow-2xl hover:scale-105 transition-all duration-300 hidden xl:block z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-[70px]">
                    <p className="text-[10px] text-slate-500 font-medium">Active Patients</p>
                    <p className="text-xl font-bold text-slate-900">50K+</p>
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
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.9"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
