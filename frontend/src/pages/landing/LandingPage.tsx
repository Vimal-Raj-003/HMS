import HeroSection from './components/HeroSection';
import MetricsSection from './components/MetricsSection';
import SpecialtiesSection from './components/SpecialtiesSection';
import DoctorsSection from './components/DoctorsSection';
import TestimonialsSection from './components/TestimonialsSection';
import TrustSection from './components/TrustSection';
import FAQSection from './components/FAQSection';
import FooterSection from './components/FooterSection';
import ChatBot from './components/ChatBot';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* ============================================
          GLOBAL FUTURISTIC BACKGROUND ANIMATION
          Extended across entire landing page
          ============================================ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Layer 1: Primary gradient base - Enhanced visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20"></div>
        
        {/* Layer 2: Radial gradient glow - Center Focus - Enhanced */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent)]"></div>
        
        {/* Layer 3: Primary gradient orb - top right - Enhanced visibility */}
        <div className="hidden md:block absolute -top-40 -right-40 lg:w-[600px] lg:h-[600px] md:w-[400px] md:h-[400px] bg-gradient-to-br from-blue-500/20 via-blue-400/12 to-teal-400/8 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Layer 4: Secondary gradient orb - left side - Enhanced visibility */}
        <div className="hidden lg:block absolute top-1/3 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-teal-500/15 via-cyan-400/10 to-blue-400/6 rounded-full blur-3xl animate-float-orb"></div>
        
        {/* Layer 5: Tertiary accent orb - bottom center - Enhanced visibility */}
        <div className="hidden xl:block absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-gradient-to-bl from-blue-400/12 via-teal-400/8 to-transparent rounded-full blur-2xl animate-pulse-slow-alt"></div>
        
        {/* Layer 6: Modern dot grid pattern - Enhanced visibility */}
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_10%,transparent_70%)]"></div>
        
        {/* Layer 7: Healthcare-themed SVG Pattern Overlay - 8% visibility */}
        <svg className="hidden lg:block absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Medical Cross Pattern */}
            <pattern id="global-medical-cross" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect fill="none" width="100" height="100"/>
              <g fill="rgba(59,130,246,0.8)" transform="translate(40, 40)">
                <rect x="4" y="0" width="12" height="20" rx="2"/>
                <rect x="0" y="4" width="20" height="12" rx="2"/>
              </g>
            </pattern>
            
            {/* DNA Helix Pattern */}
            <pattern id="dna-pattern" x="0" y="0" width="60" height="120" patternUnits="userSpaceOnUse">
              <path d="M30,10 Q45,30 30,50 Q15,70 30,90 Q45,110 30,120" fill="none" stroke="rgba(20,184,166,0.5)" strokeWidth="1.5"/>
              <path d="M30,10 Q15,30 30,50 Q45,70 30,90 Q15,110 30,120" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
              <circle cx="30" cy="30" r="3" fill="rgba(59,130,246,0.4)"/>
              <circle cx="30" cy="70" r="3" fill="rgba(20,184,166,0.4)"/>
              <circle cx="30" cy="110" r="3" fill="rgba(59,130,246,0.4)"/>
            </pattern>
            
            {/* Pulse Wave Pattern */}
            <pattern id="pulse-pattern" x="0" y="0" width="200" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M0,30 L30,30 L40,30 L50,10 L60,50 L70,25 L80,40 L90,30 L120,30 L140,30 L150,15 L160,45 L170,30 L200,30"
                fill="none"
                stroke="rgba(59,130,246,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#global-medical-cross)"/>
        </svg>
        
        {/* Layer 8: ECG Heartbeat Pattern - 8% visibility with slow continuous motion */}
        <svg className="hidden xl:block absolute inset-0 w-full h-full opacity-[0.08] animate-ecg-slide" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="global-ecg-line" x="0" y="0" width="250" height="80" patternUnits="userSpaceOnUse">
              <path
                d="M0,40 L35,40 L45,40 L58,12 L72,68 L85,32 L98,52 L112,40 L155,40 L165,40 L178,18 L192,62 L205,35 L218,48 L232,40 L250,40"
                fill="none"
                stroke="url(#global-ecg-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="global-ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.35)"/>
                  <stop offset="50%" stopColor="rgba(20,184,166,0.5)"/>
                  <stop offset="100%" stopColor="rgba(59,130,246,0.35)"/>
                </linearGradient>
              </defs>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#global-ecg-line)"/>
        </svg>
        
        {/* Layer 9: Floating Healthcare Icons - Enhanced visibility */}
        <div className="hidden xl:block absolute top-[12%] left-[6%] w-14 h-14 opacity-[0.08] animate-float-medical-icon">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="6" width="24" height="44" rx="4" stroke="currentColor" strokeWidth="2" className="text-blue-500"/>
            <rect x="24" y="14" width="8" height="8" rx="2" fill="currentColor" className="text-teal-500"/>
            <circle cx="28" cy="38" r="4" stroke="currentColor" strokeWidth="2" className="text-blue-400"/>
          </svg>
        </div>
        
        <div className="hidden xl:block absolute top-[22%] right-[10%] w-12 h-12 opacity-[0.07] animate-float-medical-icon-delayed">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 3L42 13V25C42 35 34 43 24 45C14 43 6 35 6 25V13L24 3Z" stroke="currentColor" strokeWidth="2" className="text-teal-500"/>
            <rect x="19" y="16" width="10" height="16" rx="2" fill="currentColor" className="text-blue-400" opacity="0.6"/>
            <rect x="15" y="21" width="18" height="6" rx="2" fill="currentColor" className="text-blue-400" opacity="0.6"/>
          </svg>
        </div>
        
        <div className="hidden xl:block absolute top-[55%] left-[12%] w-10 h-10 opacity-[0.07] animate-float-medical-icon-slow">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" className="text-blue-500"/>
            <path d="M20 10V20L26 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-500"/>
          </svg>
        </div>
        
        <div className="hidden 2xl:block absolute top-[75%] right-[15%] w-12 h-12 opacity-[0.06] animate-float-medical-icon-alt">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C16 4 10 10 10 18C10 28 24 36 24 36C24 36 38 28 38 18C38 10 32 4 24 4Z" stroke="currentColor" strokeWidth="1.5" className="text-red-400"/>
            <path d="M18 20L22 24L30 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"/>
          </svg>
        </div>
        
        {/* Layer 10: Soft blurred gradient circles for depth - Enhanced */}
        <div className="hidden lg:block absolute top-1/4 left-1/3 w-[250px] h-[250px] bg-gradient-radial from-blue-300/12 to-transparent rounded-full blur-3xl animate-depth-pulse"></div>
        <div className="hidden lg:block absolute bottom-1/3 right-1/3 w-[200px] h-[200px] bg-gradient-radial from-teal-300/12 to-transparent rounded-full blur-3xl animate-depth-pulse-delayed"></div>
        
        {/* Layer 11: Floating particles effect - Enhanced visibility */}
        <div className="hidden md:block absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-blue-400/35 rounded-full animate-float-particle"></div>
        <div className="hidden md:block absolute top-2/3 right-1/3 w-1 h-1 bg-teal-400/35 rounded-full animate-float-particle-delayed"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-float-particle-slow"></div>
        <div className="hidden lg:block absolute top-[25%] left-[45%] w-1 h-1 bg-blue-300/30 rounded-full animate-float-particle"></div>
        <div className="hidden xl:block absolute bottom-[40%] left-[28%] w-1 h-1 bg-teal-300/35 rounded-full animate-float-particle-slow"></div>
        <div className="hidden xl:block absolute top-[65%] right-[18%] w-1 h-1 bg-blue-400/30 rounded-full animate-float-particle-delayed"></div>
      </div>

      {/* Main Content - Above the background */}
      <div className="relative z-10">
        {/* Hero Section - Main landing area with CTA */}
        <HeroSection />
        
        {/* Platform Metrics - Key statistics */}
        <MetricsSection />
        
        {/* Specialties Section - Medical departments */}
        <SpecialtiesSection />
        
        {/* Doctors Section - Expert doctors grid */}
        <DoctorsSection />
        
        {/* Testimonials Section - Patient reviews carousel */}
        <TestimonialsSection />
        
        {/* Trust Section - Credibility metrics */}
        <TrustSection />
        
        {/* FAQ Section - Common questions */}
        <FAQSection />
        
        {/* Footer Section - Navigation and contact */}
        <FooterSection />
      </div>
      
      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
};

export default LandingPage;
