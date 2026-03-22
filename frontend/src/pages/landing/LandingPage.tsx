import { useEffect, useRef, ReactNode } from 'react';
import HeroSection from './components/HeroSection';
import MetricsSection from './components/MetricsSection';
import SpecialtiesSection from './components/SpecialtiesSection';
import DoctorsSection from './components/DoctorsSection';
import TestimonialsSection from './components/TestimonialsSection';
import TrustSection from './components/TrustSection';
import FAQSection from './components/FAQSection';
import FooterSection from './components/FooterSection';
import ChatBot from './components/ChatBot';
import ECGWaveBackground from './components/ECGWaveBackground';

/* ============================================
   ScrollAnimateSection
   Intersection Observer-based fade-in wrapper
   ============================================ */
const ScrollAnimateSection = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('animate-in');
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  return (
    <div ref={ref} className={`scroll-animate ${className}`}>
      {children}
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* ============================================
          ECG HEART RATE WAVE BACKGROUND
          Dynamic healthcare-themed animated background
          ============================================ */}
      <ECGWaveBackground />

      {/* Main Content - Above the background */}
      <div className="relative z-10">
        {/* Hero Section - Main landing area with CTA */}
        <HeroSection />

        {/* Platform Metrics - Key statistics */}
        <ScrollAnimateSection>
          <MetricsSection />
        </ScrollAnimateSection>

        {/* Specialties Section - Medical departments */}
        <ScrollAnimateSection>
          <SpecialtiesSection />
        </ScrollAnimateSection>

        {/* Doctors Section - Expert doctors grid */}
        <ScrollAnimateSection>
          <DoctorsSection />
        </ScrollAnimateSection>

        {/* Testimonials Section - Patient reviews carousel */}
        <ScrollAnimateSection>
          <TestimonialsSection />
        </ScrollAnimateSection>

        {/* Trust Section - Credibility metrics */}
        <ScrollAnimateSection>
          <TrustSection />
        </ScrollAnimateSection>

        {/* FAQ Section - Common questions */}
        <ScrollAnimateSection>
          <FAQSection />
        </ScrollAnimateSection>

        {/* Footer Section - Navigation and contact */}
        <FooterSection />
      </div>

      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
};

export default LandingPage;
